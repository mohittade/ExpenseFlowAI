# Demo Scenarios

## Scenario 1: Normal Workflow

### User Input

"Generate my travel expense report for last month and email it to finance."

### Expected Flow

1. Supervisor creates plan.
2. Expenses retrieved.
3. Date range filtered.
4. Expenses categorized.
5. Totals calculated.
6. PDF generated.
7. Validator approves.
8. User approves.
9. Email sent.

---

# Scenario 2: Missing Category

### Input Data

Description: Uber Airport Ride
Category: Missing

### Expected Agent Behavior

Expense Intelligence Agent analyzes description.

Result:

Category: Local Transport
Confidence: 0.96

System automatically updates category.

---

# Scenario 3: Critical Missing Data

### Input Data

Date: Missing
Description: Missing
Amount: ₹5000

### Expected Agent Behavior

Exception Agent detects critical missing data.

Decision:

- Cannot safely infer information.
- Flag for manual review.
- Exclude from automatic total.

---

# Scenario 4: Policy Violation

### Input

Hotel Expense: ₹15,000

Company Limit: ₹8,000

### Expected Behavior

Policy tool detects violation.

Report displays:

⚠ Policy Violation: Hotel expense exceeds allowed limit.

Validator decides whether report can proceed.

---

# Scenario 5: Validation Failure

### Problem

Calculated Total: ₹14,850

PDF Total: ₹14,500

### Expected Behavior

Validation Agent detects mismatch.

Workflow:

Validation
↓
Failure
↓
Regenerate PDF
↓
Validate Again
↓
Approved