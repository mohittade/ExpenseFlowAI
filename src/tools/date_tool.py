"""
Date tool for calculating date ranges and filtering.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


def calculate_last_month() -> tuple[str, str]:
    """Calculate the first and last day of last month."""
    today = datetime.now()
    first_day_this_month = today.replace(day=1)
    last_day_last_month = first_day_this_month - timedelta(days=1)
    first_day_last_month = last_day_last_month.replace(day=1)

    return (
        first_day_last_month.strftime("%Y-%m-%d"),
        last_day_last_month.strftime("%Y-%m-%d")
    )


def calculate_date_range(period: str) -> tuple[str, str]:
    """Calculate date range based on period description."""
    today = datetime.now()

    period_lower = period.lower()

    if "last month" in period_lower or "previous month" in period_lower:
        return calculate_last_month()

    elif "this month" in period_lower or "current month" in period_lower:
        first_day = today.replace(day=1)
        return (first_day.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"))

    elif "last week" in period_lower or "previous week" in period_lower:
        days_since_monday = today.weekday()
        last_monday = today - timedelta(days=days_since_monday + 7)
        last_sunday = last_monday + timedelta(days=6)
        return (last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d"))

    elif "this week" in period_lower or "current week" in period_lower:
        days_since_monday = today.weekday()
        this_monday = today - timedelta(days=days_since_monday)
        return (this_monday.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d"))

    elif "last quarter" in period_lower or "previous quarter" in period_lower:
        current_quarter = (today.month - 1) // 3 + 1
        if current_quarter == 1:
            last_quarter_end = datetime(today.year - 1, 12, 31)
            last_quarter_start = datetime(today.year - 1, 10, 1)
        else:
            last_quarter_end_month = (current_quarter - 1) * 3
            last_quarter_end = datetime(today.year, last_quarter_end_month, 1) - timedelta(days=1)
            last_quarter_start = datetime(today.year, last_quarter_end_month - 2, 1)
        return (last_quarter_start.strftime("%Y-%m-%d"), last_quarter_end.strftime("%Y-%m-%d"))

    elif "year to date" in period_lower or "ytd" in period_lower:
        return (f"{today.year}-01-01", today.strftime("%Y-%m-%d"))

    elif "last year" in period_lower or "previous year" in period_lower:
        return (f"{today.year - 1}-01-01", f"{today.year - 1}-12-31")

    # Default to last month
    return calculate_last_month()


def filter_expenses_by_date(expenses: List[Dict[str, Any]], start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """Filter expenses by date range."""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    filtered = []
    for exp in expenses:
        exp_date = datetime.strptime(exp["date"], "%Y-%m-%d")
        if start <= exp_date <= end:
            filtered.append(exp)

    return filtered


def parse_natural_date_range(text: str) -> tuple[str, str]:
    """Parse natural language date range from user request."""
    text_lower = text.lower()

    # Check for explicit date patterns like "July 2025" or "07/2025"
    import re
    month_year_match = re.search(r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})', text_lower)
    if month_year_match:
        month_name = month_year_match.group(1)
        year = int(month_year_match.group(2))
        month_num = datetime.strptime(month_name, "%B").month
        start = datetime(year, month_num, 1)
        if month_num == 12:
            end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = datetime(year, month_num + 1, 1) - timedelta(days=1)
        return (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))

    # Check for "month YYYY" format
    month_year_match2 = re.search(r'(\d{1,2})/(\d{4})', text)
    if month_year_match2:
        month = int(month_year_match2.group(1))
        year = int(month_year_match2.group(2))
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = datetime(year, month + 1, 1) - timedelta(days=1)
        return (start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))

    # Fall back to keyword-based detection
    return calculate_date_range(text)