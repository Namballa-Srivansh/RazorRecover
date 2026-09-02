import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from utils import local_diagnose, local_generate_outreach, local_parse_response

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
is_gemini_active = False

if api_key:
    try:
        genai.configure(api_key=api_key)
        # Verify model access with a lightweight call or just declare active
        is_gemini_active = True
        print("Gemini API successfully configured for Python AI Agent!")
    except Exception as e:
        print(f"Error configuring Gemini API, falling back to local NLP rules: {e}")

def clean_json_response(text: str) -> str:
    """Helper to strip markdown block ticks ```json ... ``` from model outputs."""
    cleaned = text.strip()
    match = re.search(r'```json\s*(.*?)\s*```', cleaned, re.DOTALL)
    if match:
        return match.group(1)
    match_any = re.search(r'```\s*(.*?)\s*```', cleaned, re.DOTALL)
    if match_any:
        return match_any.group(1)
    return cleaned

def ai_diagnose(gateway_log: str, case_type: str) -> dict:
    """Diagnoses payment failure reason using Gemini API or rule-based fallback."""
    if not is_gemini_active:
        print("Using local rule-based engine for Diagnosis.")
        return local_diagnose(gateway_log, case_type)
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are a payment reliability AI analyst for Razorpay merchants.
        Analyze the following failure details:
        Case Type: {case_type}
        Gateway Transaction Log: {gateway_log}

        Provide a diagnosis in strict JSON format with two keys:
        - "root_cause": A short, clear diagnostic description of what failed (e.g. Card expired, OTP verification timed out, Bank network error).
        - "recommendation": A specific merchant-recovery instruction (e.g. Auto-retry in 3 hours, Send SMS with dynamic billing link, Wait for salary day, Trigger manual call).

        Output ONLY valid JSON, do not include any explanatory text outside the JSON block.
        """
        response = model.generate_content(prompt)
        content = clean_json_response(response.text)
        data = json.loads(content)
        return {
            "root_cause": data.get("root_cause", "Unclassified Failure"),
            "recommendation": data.get("recommendation", "Send manual outreach link.")
        }
    except Exception as e:
        print(f"Gemini API failure during diagnosis: {e}. Falling back to local NLP.")
        return local_diagnose(gateway_log, case_type)

def ai_generate_outreach(case_type: str, amount: float, customer_name: str, root_cause: str, escalation_stage: int, tone: str) -> str:
    """Generates localized custom payment recovery outreach using Gemini API or local rules."""
    if not is_gemini_active:
        print("Using local templates for Outreach generation.")
        return local_generate_outreach(case_type, amount, customer_name, root_cause, escalation_stage, tone)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        tone_description = {
            "hinglish": "Friendly conversational Hinglish (Hindi mixed with English words, common in India, natural chat style, e.g., 'Aapka payment fail ho gaya hai, please check karein')",
            "formal": "Professional, respectful corporate English (formal invoices, dear customer, no abbreviations)",
            "casual": "Friendly, lighthearted English (emoji, active voice, helpful friend tone)"
        }.get(tone, "hinglish")

        escalation_guide = {
            0: "Friendly transaction failure alert. Simple checkout update link. No pressure.",
            1: "Follow up. Polite nudge, asking if they faced a technical error and offering help.",
            2: "Urgent check-in. Note the payment is overdue, suggest alternative methods (e.g. UPI vs card).",
            3: "Final escalation warning. Politely specify that service access may be paused if unpaid. Include stop-word compliance option ('Reply STOP to halt notifications')."
        }.get(escalation_stage, "Friendly transaction failure alert.")

        prompt = f"""
        You are an AI Revenue Recovery Agent working for a merchant.
        Create an outreach message (intended for SMS, WhatsApp, or Email) based on these details:
        - Customer Name: {customer_name}
        - Overdue Amount: INR {amount:.2f}
        - Case Type: {case_type} (e.g., checkout abandonment, subscription, invoice)
        - Failure Root Cause: {root_cause}
        - Escalation Stage: {escalation_stage} (Context: {escalation_guide})
        - Tone Preference: {tone_description}

        Requirements:
        1. Keep the message concise and optimized for mobile reading.
        2. Make sure it contains this payment link: https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}
        3. Do not sound aggressive or demanding. Sound helpful, customer-centric, and clear.
        4. Output ONLY the raw outreach message text. No extra headers, quotes, or markdown wrappers.
        """
        response = model.generate_content(prompt)
        return response.text.strip().replace('"', '')
    except Exception as e:
        print(f"Gemini API failure during outreach generation: {e}. Falling back to local NLP.")
        return local_generate_outreach(case_type, amount, customer_name, root_cause, escalation_stage, tone)

def ai_parse_response(customer_message: str, history: list, tone: str, amount: float, customer_name: str) -> dict:
    """Parses customer replies to extract semantic intents (DND requests, Promise-to-Pay dates) using Gemini API or local rules."""
    if not is_gemini_active:
        print("Using local parser for Customer Reply analysis.")
        return local_parse_response(customer_message, tone)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        history_formatted = "\n".join([f"{h['sender'].upper()}: {h['message']}" for h in history[-5:]])
        
        prompt = f"""
        You are an AI Agent analyzing customer replies for a payment recovery system.
        Analyze the customer message in the context of recent chat history:

        Recent History:
        {history_formatted}

        Latest Customer Reply: "{customer_message}"
        Current Tone Setting: {tone}
        Merchant Overdue Amount: INR {amount:.2f}
        Customer Name: {customer_name}

        Classify the response and reply back in strict JSON format with these exact keys:
        1. "opt_out": boolean. Set to true if the customer requests to stop contact, unsubscribe, messages are spam, or requests DND.
        2. "promise_to_pay": boolean. Set to true if the customer indicates an intent to make the payment in the future (e.g., "will pay tomorrow", "pay on salary day", "giving money next Friday").
        3. "promise_date": string or null. If promise_to_pay is true, estimate the promise date in ISO format (YYYY-MM-DD) relative to today's date ({datetime.now().strftime('%Y-%m-%d')}). If not clear, set to null.
        4. "sentiment": string (one of: "positive", "neutral", "negative").
        5. "next_agent_response": string. Draft an empathetic and contextually appropriate reply from the AI agent in the configured tone ({tone}).
           - If opt_out is true, acknowledge and confirm that communication will stop immediately.
           - If promise_to_pay is true, thank them and confirm the pause in notifications until the specified promise date.
           - Otherwise, guide them on how to resolve the payment using the link: https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}

        Output ONLY valid JSON, do not include any markdown wrappers or explanatory notes.
        """
        response = model.generate_content(prompt)
        content = clean_json_response(response.text)
        data = json.loads(content)
        
        return {
            "opt_out": bool(data.get("opt_out", False)),
            "promise_to_pay": bool(data.get("promise_to_pay", False)),
            "promise_date": data.get("promise_date", None),
            "sentiment": data.get("sentiment", "neutral"),
            "next_agent_response": data.get("next_agent_response", "Thank you, please proceed via the link.")
        }
    except Exception as e:
        print(f"Gemini API failure during reply parsing: {e}. Falling back to local NLP.")
        return local_parse_response(customer_message, tone)
