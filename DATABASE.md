# Database Design

The project uses SQLite.

Database file:

expenseflow.db

---

# Table 1: expenses

Stores all employee expenses.

| Field | Type | Description |
|---|---|---|
| expense_id | INTEGER | Primary Key |
| employee_id | INTEGER | Employee identifier |
| date | DATE | Expense date |
| description | TEXT | Transaction description |
| amount | REAL | Expense amount |
| category | TEXT | Expense category |
| receipt_status | TEXT | Receipt available or missing |
| status | TEXT | Valid or Review |

---

# Table 2: contacts

Stores organizational contacts.

| Field | Type |
|---|---|
| id | INTEGER |
| department | TEXT |
| email | TEXT |

Example:

Finance → finance@company.com

---

# Table 3: reports

Stores generated report information.

| Field | Type |
|---|---|
| report_id | INTEGER |
| employee_id | INTEGER |
| period_start | DATE |
| period_end | DATE |
| total_amount | REAL |
| pdf_path | TEXT |
| status | TEXT |
| created_at | TIMESTAMP |

---

# Table 4: email_logs

Stores email activity.

| Field | Type |
|---|---|
| id | INTEGER |
| report_id | INTEGER |
| recipient | TEXT |
| subject | TEXT |
| status | TEXT |
| timestamp | TIMESTAMP |

---

# Table 5: execution_logs

Stores agent execution activities.

| Field | Type |
|---|---|
| id | INTEGER |
| agent_name | TEXT |
| action | TEXT |
| status | TEXT |
| timestamp | TIMESTAMP |

---

# Table 6: expense_policies

Stores company expense rules.

| Field | Type |
|---|---|
| category | TEXT |
| maximum_limit | REAL |
| policy_description | TEXT |