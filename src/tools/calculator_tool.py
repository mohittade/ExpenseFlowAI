"""
Calculator tool for computing expense totals.
"""
from typing import List, Dict, Any


def calculate_category_totals(expenses: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate totals by category."""
    totals = {}
    for exp in expenses:
        category = exp.get("category") or "Uncategorized"
        amount = exp.get("amount", 0)
        totals[category] = totals.get(category, 0) + amount
    return totals


def calculate_grand_total(expenses: List[Dict[str, Any]]) -> float:
    """Calculate grand total of all expenses."""
    return sum(exp.get("amount", 0) for exp in expenses)


def calculate_category_breakdown(expenses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Calculate detailed breakdown by category."""
    totals = calculate_category_totals(expenses)
    grand_total = calculate_grand_total(expenses)

    breakdown = []
    for category, total in sorted(totals.items(), key=lambda x: x[1], reverse=True):
        percentage = (total / grand_total * 100) if grand_total > 0 else 0
        breakdown.append({
            "category": category,
            "total": round(total, 2),
            "percentage": round(percentage, 1),
            "count": sum(1 for e in expenses if (e.get("category") or "Uncategorized") == category)
        })

    return breakdown


def summarize_expenses(expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a complete expense summary."""
    if not expenses:
        return {
            "grand_total": 0,
            "category_totals": {},
            "breakdown": [],
            "expense_count": 0,
            "date_range": {"start": None, "end": None}
        }

    dates = [exp["date"] for exp in expenses if exp.get("date")]
    return {
        "grand_total": round(calculate_grand_total(expenses), 2),
        "category_totals": {k: round(v, 2) for k, v in calculate_category_totals(expenses).items()},
        "breakdown": calculate_category_breakdown(expenses),
        "expense_count": len(expenses),
        "date_range": {
            "start": min(dates) if dates else None,
            "end": max(dates) if dates else None
        }
    }