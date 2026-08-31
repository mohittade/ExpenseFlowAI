"""
Policy tool for checking expense policy compliance.
"""
from typing import List, Dict, Any, Optional
from src.tools.database_tool import retrieve_policies


def get_policy_limits() -> Dict[str, float]:
    """Get policy limits by category."""
    policies = retrieve_policies()
    return {p["category"]: p["max_amount"] for p in policies}


def check_policy_limits(expenses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Check expenses against policy limits."""
    limits = get_policy_limits()
    violations = []

    for exp in expenses:
        category = exp.get("category") or "Uncategorized"
        amount = exp.get("amount", 0)
        limit = limits.get(category)

        if limit is not None and amount > limit:
            violations.append({
                "expense_id": exp.get("id"),
                "date": exp.get("date"),
                "merchant": exp.get("merchant"),
                "category": category,
                "amount": amount,
                "limit": limit,
                "excess": round(amount - limit, 2),
                "description": exp.get("description", "")
            })

    return violations


def get_policy_summary() -> List[Dict[str, Any]]:
    """Get all policies with descriptions."""
    policies = retrieve_policies()
    return [
        {
            "category": p["category"],
            "max_amount": p["max_amount"],
            "description": p["description"]
        }
        for p in policies
    ]


def check_single_expense(category: str, amount: float) -> Optional[Dict[str, Any]]:
    """Check a single expense against policy."""
    limits = get_policy_limits()
    limit = limits.get(category)

    if limit is not None and amount > limit:
        return {
            "category": category,
            "amount": amount,
            "limit": limit,
            "excess": round(amount - limit, 2),
            "violated": True
        }

    return {
        "category": category,
        "amount": amount,
        "limit": limit,
        "excess": 0,
        "violated": False
    }