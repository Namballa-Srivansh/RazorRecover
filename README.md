# RazorRecover — AI Revenue Recovery System

> **Autonomous AI-powered revenue recovery system for merchants** — built for Track 03 (AI Revenue Recovery).

RazorRecover detects revenue at risk, diagnoses root causes from payment failure and webhook logs, determines the right intervention, and executes bounded, compliant recovery workflows with measurable financial outcomes.

---

## 🚀 Key Features

- **End-to-End Closed Loop Recovery**:
  - **Detection & Cohort Ingestion**: Batch upload failed charges, checkout drop-offs, and subscription renewal failures via JSON/webhooks.
  - **AI Root Cause Diagnosis**: Analyzes raw gateway error logs to isolate exact failure causes (OTP timeouts, 3DS auth issues, card limit/expiry, network drops).
  - **Autonomous Multi-Channel Outreach**: Generates context-aware recovery links via Email, SMS, or WhatsApp tailored by escalation stage (Stages 0–3).
  - **Hinglish & Multi-Tone Communication**: Native support for conversational Hinglish, Formal English, and Casual friendly tones.
  - **Promise-to-Pay Tracker**: Detects customer repayment intent and dates (e.g., *"salary day"*, *"kal pay kar dunga"*), automatically scheduling non-intrusive follow-ups.
  - **Strict Compliance & Stopping Rules**: Instantly halts outreach when opt-out/DND keywords are detected (`stop`, `dnd`, `opt-out`, `fraud`).
  - **Immutable Audit Trail**: Logs every ingestion, AI reasoning step, escalation change, customer message, and payment confirmation.
  - **Live Agent Playground**: Interactive sandbox to simulate customer conversations and inspect real-time AI reasoning logs.

---

## 📁 Project Structure

```
RazorPay/
├── ai_agent/                     # Python FastAPI AI Microservice
│   ├── agent.py                  # Gemini 1.5 Flash LLM integration & prompt chains
│   ├── main.py                   # FastAPI REST API endpoints
│   ├── utils.py                  # Local rule-based NLP fallback & regex parser
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Gemini API configuration & port
│
├── backend/                      # Node.js & Express API Gateway
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── batchController.js    # Cohort ingestion & batch stats
│   │   ├── caseController.js     # Case lifecycle, outreach & reply processor
│   │   ├── dashboardController.js# Recovery analytics & timeline metrics
│   │   └── playbookController.js # Playbook & compliance rules
│   ├── models/
│   │   ├── AuditLog.js           # Immutable event & compliance logs
│   │   ├── Batch.js              # Cohort metadata & financial recovery metrics
│   │   ├── Case.js               # Case schema, status, conversations & history
│   │   └── Playbook.js           # Tone settings, retry sequencer & stopping rules
│   ├── routes/                   # Express router definitions
│   ├── server.js                 # App entry point & sample demo data seeder
│   └── package.json
│
└── frontend/                     # Next.js Web Dashboard
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx          # Executive Analytics Dashboard (KPIs, Charts)
    │   │   ├── batches/page.tsx  # Ingest Cohorts & Batch Performance View
    │   │   ├── cases/page.tsx    # Recovery Queue, Root Cause Diagnosis & Actions
    │   │   ├── playground/page.tsx# Interactive AI Simulator & Cognitive Reasoning
    │   │   ├── playbooks/page.tsx# Settings, Compliance Rules & Retry Sequencer
    │   │   └── layout.tsx        # App layout with Sidebar navigation
    │   ├── components/           # UI components (Sidebar, Badges, Modals)
    │   └── utils/
    │       └── api.ts            # Frontend API client
    └── package.json
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, Axios, Cors |
| **AI Agent** | Python 3.13, FastAPI, Uvicorn, Google Gemini 1.5 Flash, Pydantic |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas)

---

### 1. Start the Python AI Agent
```bash
cd ai_agent
# Activate virtual environment
.\venv\Scripts\activate   # On Windows (or source venv/bin/activate on macOS/Linux)

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server (runs on port 8000)
python main.py
```
> *(Optional)* Add your `GEMINI_API_KEY` to `ai_agent/.env`. If not provided, the service automatically falls back to its built-in rule-based NLP engine.

---

### 2. Start the Backend API
```bash
cd backend

# Install dependencies
npm install

# Start Express server (runs on port 5000)
npm start
```
*The backend automatically seeds demo recovery cohorts and playbook settings upon first run.*

---

### 3. Start the Frontend Dashboard
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server (runs on port 3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/kpis` | Real-time recovery rates and value saved |
| `GET` | `/api/dashboard/timeline` | Daily recovery timeline metrics |
| `GET` / `POST` | `/api/batches` | List batches or ingest new failure cohorts |
| `GET` / `PUT` | `/api/cases` | Filter cases by status or update case details |
| `POST` | `/api/cases/:id/outreach` | Trigger AI agentic outreach generation |
| `POST` | `/api/cases/:id/reply` | Process customer response & intent analysis |
| `POST` | `/api/cases/:id/confirm-payment` | Mark case recovered and update financial metrics |
| `GET` / `PUT` | `/api/playbooks` | View and configure tone, retry sequence, and DND rules |

---

## 🛡️ Compliance & Safety

- **Bounded Escalation**: Outreach strictly advances from informative nudges to warning notifications without spamming.
- **Immediate Opt-Out**: Automatic detection of customer DND intent immediately transitions cases to `paused` status and logs a compliance record in the audit trail.
- **Secure Fallbacks**: Dual AI pipeline ensures 100% uptime with graceful fallback between Google Gemini and deterministic local rules.
