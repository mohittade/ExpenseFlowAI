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
from src.logging_config import LogContext


class ExpenseIntelligenceAgent:
    """Agent responsible for retrieving and categorizing expenses."""

    def __init__(self):
        self.name = "expense_intelligence"

    def _filter_by_request(self, user_request: str, expenses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter retrieved expenses when the request names a specific expense type."""
        request = user_request.lower()
        category_aliases = {
            "Flights": ("flight", "air travel", "airfare", "airline"),
            "Lodging": ("lodging", "hotel", "stay", "accommodation"),
            "Meals": ("meal", "food", "dinner", "lunch", "breakfast"),
            "Transport": ("transport", "taxi", "uber", "lyft", "car rental", "travel"),
            "Supplies": ("supply", "supplies", "office"),
            "Registration": ("registration", "conference fee"),
        }

        positive_categories = []
        for category, keywords in category_aliases.items():
            if any(keyword in request for keyword in keywords):
                positive_categories.append(category)

        if "travel" in request and "lodging" not in request and "hotel" not in request and "meal" not in request:
            positive_categories = ["Flights", "Transport"]

        if not positive_categories:
            return expenses

        return [
            expense for expense in expenses
            if (expense.get("category") or "").lower()
            in {category.lower() for category in positive_categories}
        ]

    def retrieve_and_filter(self, run_id: str, date_range_desc: str, employee_id: int = 1, user_request: str = "") -> Dict[str, Any]:
        """Retrieve expenses and filter by date range."""
        with LogContext(run_id=run_id, agent=self.name, step="retrieve_expenses"):
            log_execution(run_id, self.name, "retrieve_expenses", "started", f"Date range: {date_range_desc}")

            start_date, end_date = parse_natural_date_range(date_range_desc)
            expenses = retrieve_expenses(employee_id=employee_id, start_date=start_date, end_date=end_date)
            expenses = self._filter_by_request(user_request, expenses)

            log_execution(run_id, self.name, "retrieve_expenses", "completed", f"Retrieved {len(expenses)} expenses")
            return {
                "expenses": expenses,
                "date_range": {"start": start_date, "end": end_date}
            }

    def categorize_expenses(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Categorize uncategorized expenses using LLM."""
        with LogContext(run_id=run_id, agent=self.name, step="categorize"):
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
        with LogContext(run_id=run_id, agent=self.name, step="summarize"):
            log_execution(run_id, self.name, "summarize", "started", f"Summarizing {len(expenses)} expenses")
            summary = summarize_expenses(expenses)
            log_execution(run_id, self.name, "summarize", "completed", f"Grand total: {summary['grand_total']}")
            return summary