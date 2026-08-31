# Agent Design

ExpenseFlow AI uses four specialized agents.

All agents are powered by the same underlying LLM:

NVIDIA Nemotron-3-Ultra-550B-A55B

The agents differ in their roles, system prompts, objectives, decision rules, and available tools.

---

# Agent 1: Supervisor & Planning Agent

## Purpose

The Supervisor Agent acts as the central coordinator.

## Responsibilities

- Understand user requests
- Extract task requirements
- Create execution plans
- Route tasks to agents
- Decide next actions
- Handle workflow failures

## Example Input

"Generate my travel expense report for last month and email it to finance."

## Example Output

```json
{
  "task": "generate_expense_report",
  "expense_type": "travel",
  "date_range": "last_month",
  "generate_pdf": true,
  "send_email": true,
  "recipient": "finance"
}# Agent Design

ExpenseFlow AI uses four specialized agents.

All agents are powered by the same underlying LLM:

NVIDIA Nemotron-3-Ultra-550B-A55B

The agents differ in their roles, system prompts, objectives, decision rules, and available tools.

---

# Agent 1: Supervisor & Planning Agent

## Purpose

The Supervisor Agent acts as the central coordinator.

## Responsibilities

- Understand user requests
- Extract task requirements
- Create execution plans
- Route tasks to agents
- Decide next actions
- Handle workflow failures

## Example Input

"Generate my travel expense report for last month and email it to finance."

## Example Output

```json
{
  "task": "generate_expense_report",
  "expense_type": "travel",
  "date_range": "last_month",
  "generate_pdf": true,
  "send_email": true,
  "recipient": "finance"
}




Agent 2: Expense Intelligence Agent
Purpose

Analyzes and understands expense transactions.

Responsibilities
Categorize transactions
Identify travel expenses
Analyze ambiguous descriptions
Provide confidence scores
Categories
Air Travel
Accommodation
Local Transport
Meals
Other
Example

Input:

Uber Airport to Hotel

Output:

{
  "category": "Local Transport",
  "confidence": 0.96
}
Agent 3: Data Exception Agent
Purpose

Handles missing or incomplete data.

Responsibilities
Detect missing fields
Decide if information can be inferred
Flag critical missing information
Mark transactions for manual review
Decision Rule

If confidence >= 0.85:
Automatically infer information.

If confidence < 0.85:
Flag for manual review.

The agent must never invent critical financial information.

Agent 4: Validation Agent
Purpose

Acts as the quality assurance layer.

Responsibilities
Validate date ranges
Verify categorization
Check calculations
Check policy violations
Validate generated PDF
Approve or reject the report
Output
{
  "status": "APPROVED",
  "issues": []
}

Or:

{
  "status": "REQUIRES_CORRECTION",
  "issues": [
    "PDF total does not match calculated total"
  ]
}