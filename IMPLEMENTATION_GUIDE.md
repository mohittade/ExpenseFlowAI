# Implementation Guide

## Phase 1: Project Setup

Create project folder.

Create virtual environment.

Install dependencies.

Required packages:

- langgraph
- langchain
- langchain-openai
- streamlit
- pandas
- reportlab
- pydantic
- python-dotenv

---

## Phase 2: Database

Tasks:

1. Create SQLite database.
2. Create required tables.
3. Insert sample expenses.
4. Insert sample contacts.
5. Insert company policies.

Test database queries independently.

---

## Phase 3: Build Tools

Build and test tools individually.

### Tool 1: Database Tool

Functions:

- retrieve_expenses()
- retrieve_contacts()

### Tool 2: Date Tool

Functions:

- calculate_last_month()
- filter_date_range()

### Tool 3: Calculator Tool

Functions:

- calculate_category_totals()
- calculate_grand_total()

### Tool 4: Policy Tool

Functions:

- check_policy_limits()

### Tool 5: PDF Tool

Functions:

- generate_expense_report()

### Tool 6: Email Tool

Functions:

- send_report_email()

---

## Phase 4: Connect LLM

Connect NVIDIA Nemotron API.

Test:

- Basic chat
- Structured JSON output
- Agent prompts

---

## Phase 5: Build Agents

Implement:

1. Supervisor Agent
2. Expense Intelligence Agent
3. Exception Agent
4. Validation Agent

Test each agent independently.

---

## Phase 6: Build LangGraph

Create:

- Shared State
- Nodes
- Edges
- Conditional Routing
- Validation Loop

---

## Phase 7: Integration

Connect:

User Input
↓
Agents
↓
Tools
↓
Validation
↓
Output

---

## Phase 8: Streamlit UI

Create:

- User input section
- Agent execution visualization
- Expense summary
- Exception summary
- Policy violations
- PDF download
- Approval button
- Email status

---

## Phase 9: Testing

Test:

1. Normal expenses
2. Missing category
3. Missing receipt
4. Missing critical data
5. Policy violation
6. Incorrect PDF total
7. Email failure

---

## Phase 10: Deployment

Deploy the application.

Potential platforms:

- Streamlit Community Cloud
- Render
- Railway

Use environment variables for API keys and email credentials.