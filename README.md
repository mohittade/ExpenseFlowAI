# ExpenseFlow AI

## Multi-Agent Autonomous Travel Expense Report System

ExpenseFlow AI is an Agentic AI system designed to automate the process of generating travel expense reports.

The user can provide a natural language request such as:

> "Generate my travel expense report for last month and email it to finance."

The system autonomously understands the request, plans the required actions, retrieves expenses, handles missing information, categorizes transactions, calculates totals, generates a PDF report, validates the result, and sends it via email.

---

## Key Features

- Natural language task input
- Multi-agent architecture
- Autonomous task planning
- Expense retrieval from database
- Date range filtering
- AI-powered expense categorization
- Missing data handling
- Confidence-based decisions
- Expense policy validation
- Accurate Python-based calculations
- PDF report generation
- Validation and correction loop
- Human approval before email
- Email delivery
- Execution and audit logs

---

## Technology Stack

| Component | Technology |
|---|---|
| LLM | NVIDIA Nemotron-3-Ultra-550B-A55B |
| Agent Framework | LangGraph |
| Language | Python |
| Frontend | Streamlit |
| Database | SQLite |
| Data Processing | Pandas |
| PDF Generation | ReportLab |
| Validation | Pydantic |
| Email | SMTP |
| Configuration | python-dotenv |

---

## System Architecture

User
↓
Streamlit Interface
↓
LangGraph Orchestrator
↓
Multi-Agent System
↓
Python Tools
↓
PDF Report + Email

---

## Agents

1. Supervisor & Planning Agent
2. Expense Intelligence Agent
3. Data Exception Agent
4. Validation Agent

---

## Project Status

Core workflow complete. Streamlit UI ready.

---

## Quick Start

### 1. Setup
```bash
# Create virtual environment
python -m venv venv

# Activate
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your API keys and SMTP credentials
```

### 2. Run the Application
```bash
# Option 1: Using the batch file (Windows)
run_app.bat

# Option 2: Direct command
venv\Scripts\streamlit run src/ui/streamlit_app.py
```

### 3. Use the App
1. Open http://localhost:8501 in your browser
2. Enter a natural language request like:
   - "Generate my travel expense report for July 2025 and email it to finance."
   - "Create expense report for last month."
3. Click **Generate Report**
4. Review the results: expenses, policy violations, missing data
5. Approve or reject the report
6. Download the PDF or send via email

---

## Example Requests

| Request | Date Range | Expected Result |
|---------|------------|-----------------|
| "Generate my travel expense report for July 2025" | July 1-31, 2025 | 11 expenses, $1,801.49, 2 violations |
| "Create expense report for last month" | Previous calendar month | Varies by current date |
| "Generate travel expense report for August 2025" | August 1-31, 2025 | 4 expenses, $820.00 |

---

## Configuration

Edit `.env` with your credentials:

```env
# NVIDIA Nemotron API (for AI categorization)
NVIDIA_API_KEY=your_api_key_here

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Database
DATABASE_PATH=expenseflow.db
```

---

## Project Structure

```
ExpenseFlowAI/
├── src/
│   ├── main.py                 # Entry point
│   ├── utils/
│   │   ├── database.py         # SQLite setup
│   │   └── llm_client.py       # NVIDIA Nemotron client
│   ├── tools/
│   │   ├── database_tool.py    # Data queries
│   │   ├── date_tool.py        # Date parsing
│   │   ├── calculator_tool.py  # Totals
│   │   ├── policy_tool.py      # Policy validation
│   │   ├── pdf_tool.py         # ReportLab PDF
│   │   └── email_tool.py       # SMTP email
│   ├── agents/
│   │   ├── supervisor_agent.py
│   │   ├── expense_intelligence_agent.py
│   │   ├── exception_agent.py
│   │   └── validation_agent.py
│   ├── graph/
│   │   └── workflow.py         # LangGraph orchestration
│   └── ui/
│       └── streamlit_app.py    # Streamlit UI
├── expenseflow.db              # SQLite database
├── requirements.txt
├── .env.example
└── run_app.bat
```