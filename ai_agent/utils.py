import re
from datetime import datetime, timedelta

def local_diagnose(gateway_log: str, case_type: str) -> dict:
    """Fallback local diagnostic parser for payment failures."""
    log_lower = gateway_log.lower()
    
    if "otp" in log_lower or "auth" in log_lower or "3d" in log_lower or "authentication" in log_lower:
        root_cause = "Dynamic Authentication Failed (OTP Timeout/Mismatch)"
        recommendation = "Retry via WhatsApp notification with quick-payment retry link; prompt dynamic fallback bank gateway."
    elif "limit" in log_lower or "insufficient" in log_lower or "funds" in log_lower or "balance" in log_lower:
        root_cause = "Insufficient Funds / Card Credit Limit Exceeded"
        recommendation = "Deploy subscription retry sequencer; queue retry on common salary days (1st/5th) and send reminder."
    elif "expired" in log_lower or "expiry" in log_lower:
        root_cause = "Expired Payment Instrument"
        recommendation = "Send update payment method link. Prompt customer to add an alternate card or UPI mandate."
    elif "network" in log_lower or "timeout" in log_lower or "gateway" in log_lower or "server" in log_lower:
        root_cause = "Transient Gateway Network Error"
        recommendation = "Initiate auto-retry sequencer immediately (after 5 minutes). High probability of success on dynamic retry."
    else:
        # Defaults based on case type
        if case_type == "checkout_abandonment":
            root_cause = "Payment Screen Drop-off (Friction)"
            recommendation = "Offer discount code (5% off) or direct instant UPI deep link to recover checkout."
        elif case_type == "subscription_failed":
            root_cause = "Card Pre-authorization Failed"
            recommendation = "Trigger automated mandate retry sequence. Alert customer to authorise recurring billing."
        elif case_type == "overdue_invoice":
            root_cause = "Delayed B2B Accounts Receivable"
            recommendation = "Schedule sequential escalation notices. Trigger friendly Hinglish whatsapp follow-up."
        else:
            root_cause = "Generic Transaction Decline"
            recommendation = "Send transaction retry request with alternative payment methods (UPI, Netbanking)."

    return {
        "root_cause": root_cause,
        "recommendation": recommendation
    }

def local_generate_outreach(case_type: str, amount: float, customer_name: str, root_cause: str, escalation_stage: int, tone: str) -> str:
    """Local generator for outreach templates depending on parameters."""
    
    # Tone mapping
    if tone == "hinglish":
        if escalation_stage == 0:
            return (f"Hi {customer_name}! Humne dekha ki aapka payment of Rs.{amount:.2f} verify nahi ho paya "
                    f"due to: {root_cause}. Koi dikkat nahi, aap niche diye gaye secure link se direct payment retry kar sakte hain. "
                    f"Link: https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        elif escalation_stage == 1:
            return (f"Hey {customer_name}, just checking in! Rs.{amount:.2f} ka payment abhi bhi status failure me hai. "
                    f"Agar koi technical issue hai toh humein batayein, ya direct is link par payment confirm karein: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}. Dhanyawaad!")
        elif escalation_stage == 2:
            return (f"Suno {customer_name}, humne aapko pehle bhi reachout kiya tha payment of Rs.{amount:.2f} ke liye. "
                    f"Agar aapko partial payment ya dynamic payment method options chahiye, click karein: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}. Let's settle this today, please!")
        else: # Stage 3 - Final chaser
            return (f"Hi {customer_name}. Rs.{amount:.2f} ka payment verify na hone ki wajah se aapka access automatic pause ho sakta hai. "
                    f"Kindly update immediately to avoid service block. link: https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}. "
                    f"Agar aap stop likhenge, toh hum message karna band kar denge.")

    elif tone == "formal":
        if escalation_stage == 0:
            return (f"Dear {customer_name}, we noticed that your transaction of INR {amount:.2f} could not be processed "
                    f"due to: {root_cause}. We request you to update your billing details or retry using the link: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        elif escalation_stage == 1:
            return (f"Dear {customer_name}, this is a reminder regarding your unpaid amount of INR {amount:.2f}. "
                    f"To prevent any service interruption, please complete the transaction using the payment link: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        elif escalation_stage == 2:
            return (f"Dear {customer_name}, this is our third attempt to contact you regarding the overdue payment of INR {amount:.2f}. "
                    f"Please resolve this matter today by clicking: https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        else:
            return (f"Dear {customer_name}, please be advised that failing to settle the invoice of INR {amount:.2f} immediately "
                    f"may result in account suspension and escalation to our billing desk. Settle at: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")

    else: # Casual
        if escalation_stage == 0:
            return (f"Hey {customer_name}! It looks like your transaction of INR {amount:.2f} had a hiccup "
                    f"({root_cause}). No worries! You can fix it quickly by retrying here: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        elif escalation_stage == 1:
            return (f"Hey {customer_name}, just a friendly nudge about the pending INR {amount:.2f}. "
                    f"Could you tap this link to retry and get back on track? Link: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        elif escalation_stage == 2:
            return (f"Hey {customer_name}! Let's get that payment of INR {amount:.2f} sorted. "
                    f"If you're having issues with cards, try paying via UPI on our link: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}")
        else:
            return (f"Hey {customer_name}, we haven't heard back about the overdue INR {amount:.2f}. "
                    f"To avoid your account getting temporarily locked, please click here: "
                    f"https://rzp.io/l/recv-{customer_name.lower().replace(' ', '')}. Let us know if you need help!")

def local_parse_response(customer_message: str, tone: str) -> dict:
    """Parses customer replies to detect: opt-out request, promise-to-pay intent, or custom message draft."""
    msg = customer_message.lower()
    
    # 1. Opt-out check (Stopping rules)
    opt_out_words = ["stop", "opt-out", "unsubscribe", "dnd", "remove", "harass", "spam", "abuse", "gussa", "nahi chahiye"]
    is_opt_out = any(word in msg for word in opt_out_words)
    
    if is_opt_out:
        next_response = ("Humne aapka number block list me daal diya hai. Recovery updates ab band ho gaye hain. "
                         "Apologies for any inconvenience.") if tone == "hinglish" else \
                        ("We have opted you out of further communications. Your case has been paused. "
                         "We apologize for the inconvenience.")
        return {
            "opt_out": True,
            "promise_to_pay": False,
            "promise_date": None,
            "sentiment": "negative",
            "next_agent_response": next_response
        }
        
    # 2. Promise to Pay check
    promise_keywords = [
        "pay tomorrow", "pay later", "kal dunga", "kal payment", "salary", "friday", "monday", 
        "weekend", "next week", "deta hu", "parso", "after 2 days", "settle later", "promise", "next month"
    ]
    is_promise = any(word in msg for word in promise_keywords)
    
    if is_promise:
        promise_date = datetime.now()
        # Rudimentary date parsing from text
        if "tomorrow" in msg or "kal" in msg:
            promise_date += timedelta(days=1)
        elif "friday" in msg:
            # find next friday
            days_ahead = 4 - promise_date.weekday()
            if days_ahead <= 0: days_ahead += 7
            promise_date += timedelta(days=days_ahead)
        elif "monday" in msg:
            days_ahead = 0 - promise_date.weekday()
            if days_ahead <= 0: days_ahead += 7
            promise_date += timedelta(days=days_ahead)
        elif "parso" in msg or "after 2 days" in msg:
            promise_date += timedelta(days=2)
        elif "salary" in msg:
            # Assume 1st of next month or in 5 days
            if promise_date.day >= 25:
                # Next month 1st
                next_month = promise_date.month % 12 + 1
                year = promise_date.year + (1 if next_month == 1 else 0)
                promise_date = datetime(year, next_month, 1)
            else:
                promise_date += timedelta(days=5)
        else:
            # default 3 days
            promise_date += timedelta(days=3)
            
        next_response = (f"Shukriya confirm karne ke liye. Humne verify kar liya hai aur auto-retry "
                         f"{promise_date.strftime('%d-%b-%Y')} tak pause kar diya hai. Tab tak aapse contact nahi kiya jayega.") if tone == "hinglish" else \
                        (f"Thank you for the confirmation. We have logged your promise to pay on "
                         f"{promise_date.strftime('%d-%b-%Y')} and paused retries until then. Have a great day!")
                         
        return {
            "opt_out": False,
            "promise_to_pay": True,
            "promise_date": promise_date.isoformat(),
            "sentiment": "positive",
            "next_agent_response": next_response
        }

    # 3. Default generic replies
    if tone == "hinglish":
        next_response = "Samajh gaya. Please secure checkout link check karein aur payment complete karein. Let us know if you need help."
    elif tone == "formal":
        next_response = "We have received your message. Please click on the recovery link to fulfill your payment obligation, or contact our customer care desk."
    else: # Casual
        next_response = "Got it! Feel free to use the payment link to complete this transaction. Hit us up if you face any issues!"
        
    return {
        "opt_out": False,
        "promise_to_pay": False,
        "promise_date": None,
        "sentiment": "neutral",
        "next_agent_response": next_response
    }
