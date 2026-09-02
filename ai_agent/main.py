import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from agent import ai_diagnose, ai_generate_outreach, ai_parse_response

app = FastAPI(title="RazorRecover Python AI Agentic Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class DiagnoseRequest(BaseModel):
    case_id: str
    case_type: str
    amount: float
    customer_name: str
    gateway_log: str

class OutreachRequest(BaseModel):
    case_id: str
    case_type: str
    amount: float
    customer_name: str
    root_cause: str
    escalation_stage: int
    tone: str

class MessageHistoryItem(BaseModel):
    sender: str
    message: str

class ParseResponseRequest(BaseModel):
    customer_message: str
    history: List[MessageHistoryItem]
    tone: str
    amount: float
    customer_name: str

@app.get("/health")
def health():
    return {"status": "healthy", "service": "Python AI Agent"}

@app.post("/api/diagnose")
def diagnose_endpoint(req: DiagnoseRequest):
    try:
        result = ai_diagnose(req.gateway_log, req.case_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_outreach")
def outreach_endpoint(req: OutreachRequest):
    try:
        message = ai_generate_outreach(
            req.case_type, 
            req.amount, 
            req.customer_name, 
            req.root_cause, 
            req.escalation_stage, 
            req.tone
        )
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse_response")
def parse_endpoint(req: ParseResponseRequest):
    try:
        # Convert history items to list of dicts
        hist = [{"sender": item.sender, "message": item.message} for item in req.history]
        result = ai_parse_response(
            req.customer_message, 
            hist, 
            req.tone, 
            req.amount, 
            req.customer_name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)
