"""
Data Exception Agent.
"""
from typing import Dict, Any, List
from src.utils.llm_client import llm_client
from src.tools import log_execution


class ExceptionAgent:
    """Agent responsible for detecting and handling missing/incomplete data."""

    def __init__(self):
        self.name = "exception"

    def check_missing_data(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check expenses for missing critical data."""
        log_execution(run_id, self.name, "check_missing", "started", f"Checking {len(expenses)} expenses")

        missing_data = []
        critical_fields = ["category", "description", "receipt_path"]

        for exp in expenses:
            for field in critical_fields:
                if not exp.get(field):
                    severity = "high" if field in ["category", "receipt_path"] else "medium"
                    missing_data.append({
                        "expense_id": exp.get("id"),
                        "date": exp.get("date"),
                        "merchant": exp.get("merchant"),
                        "issue": f"Missing {field.replace('_', ' ').title()}",
                        "severity": severity,
                        "details": f"Field '{field}' is empty for expense ${exp.get('amount', 0)}"
                    })

        # Also use LLM for more nuanced detection
        if missing_data:
            messages = [
                {"role": "system", "content": """You are an expense data quality expert.
Review the missing data issues and determine if any require human intervention.
Return JSON with: requires_human (bool), missing_data (array with same items)"""},
                {"role": "user", "content": f"Missing data issues: {missing_data}"}
            ]
            result = llm_client.chat_json(messages)
            missing_data = result.get("missing_data", missing_data)
            requires_human = result.get("requires_human", any(m["severity"] == "high" for m in missing_data))
        else:
            requires_human = False

        log_execution(run_id, self.name, "check_missing", "completed", f"Found {len(missing_data)} issues, human_required: {requires_human}")
        return {
            "missing_data": missing_data,
            "requires_human": requires_human
        }

    def handle_missing_category(self, run_id: str, expense: Dict[str, Any]) -> Dict[str, Any]:
        """Attempt to infer missing category from merchant/description."""
        # This would use ML or rules in production
        merchant = expense.get("merchant", "").lower()
        desc = (expense.get("description") or "").lower()
        text = f"{merchant} {desc}"

        category_keywords = {
            "Flights": ["airline", "delta", "united", "american", "southwest", "flight"],
            "Lodging": ["hotel", "marriott", "hilton", "hyatt", "inn", "lodging"],
            "Meals": ["restaurant", "cafe", "chipotle", "mcdonald", "starbucks", "dinner", "lunch"],
            "Transport": ["uber", "lyft", "taxi", "rental", "enterprise", "transport"],
            "Supplies": ["amazon", "office", "supplies", "staples"],
            "Registration": ["conference", "registration", "eventbrite", "ticket"]
        }

        for cat, keywords in category_keywords.items():
            if any(k in text for k in keywords):
                return {"category": cat, "confidence": 0.8, "inferred": True}

        return {"category": "Other", "confidence": 0.3, "inferred": True}