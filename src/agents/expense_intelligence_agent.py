"""
Expense Intelligence Agent.
"""
from typing import Dict, Any, List
from src.utils.llm_client import llm_client
from src.tools import (
    retrieve_expenses,
    filter_expenses_by_date,
    parse_natural_date_range,
    summarize_expenses,
    log_execution
)


class ExpenseIntelligenceAgent:
    """Agent responsible for retrieving and categorizing expenses."""

    def __init__(self):
        self.name = "expense_intelligence"

    def retrieve_and_filter(self, run_id: str, date_range_desc: str, employee_id: int = 1) -> Dict[str, Any]:
        """Retrieve expenses and filter by date range."""
        log_execution(run_id, self.name, "retrieve_expenses", "started", f"Date range: {date_range_desc}")

        start_date, end_date = parse_natural_date_range(date_range_desc)
        expenses = retrieve_expenses(employee_id=employee_id, start_date=start_date, end_date=end_date)

        log_execution(run_id, self.name, "retrieve_expenses", "completed", f"Retrieved {len(expenses)} expenses")
        return {
            "expenses": expenses,
            "date_range": {"start": start_date, "end": end_date}
        }

    def categorize_expenses(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Categorize uncategorized expenses using LLM."""
        log_execution(run_id, self.name, "categorize", "started", f"Categorizing {len(expenses)} expenses")

        uncategorized = [e for e in expenses if not e.get("category")]
        if not uncategorized:
            log_execution(run_id, self.name, "categorize", "completed", "No uncategorized expenses")
            return {"categorized": [], "updated_expenses": expenses}

        messages = [
            {"role": "system", "content": """You are an expense categorization expert.
Given a list of expenses with merchant, amount, and description, assign the most appropriate category.
Categories: Flights, Lodging, Meals, Transport, Supplies, Registration, Other
Return JSON with array of: id, category, confidence (0-1)"""},
            {"role": "user", "content": f"Expenses to categorize: {uncategorized}"}
        ]

        result = llm_client.chat_json(messages)
        categorized = result.get("categorized", [])

        # Update expenses with categories
        updated_expenses = []
        cat_map = {c["id"]: c for c in categorized}
        for exp in expenses:
            if exp["id"] in cat_map:
                exp = exp.copy()
                exp["category"] = cat_map[exp["id"]]["category"]
            updated_expenses.append(exp)

        log_execution(run_id, self.name, "categorize", "completed", f"Categorized {len(categorized)} expenses")
        return {"categorized": categorized, "updated_expenses": updated_expenses}

    def summarize(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate expense summary."""
        log_execution(run_id, self.name, "summarize", "started", f"Summarizing {len(expenses)} expenses")
        summary = summarize_expenses(expenses)
        log_execution(run_id, self.name, "summarize", "completed", f"Grand total: {summary['grand_total']}")
        return summary