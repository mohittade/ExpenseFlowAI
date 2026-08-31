"""
Tools package initialization.
"""
from src.tools.database_tool import (
    retrieve_expenses,
    retrieve_contacts,
    retrieve_policies,
    log_execution,
    get_execution_logs
)

from src.tools.date_tool import (
    calculate_last_month,
    calculate_date_range,
    filter_expenses_by_date,
    parse_natural_date_range
)

from src.tools.calculator_tool import (
    calculate_category_totals,
    calculate_grand_total,
    calculate_category_breakdown,
    summarize_expenses
)

from src.tools.policy_tool import (
    get_policy_limits,
    check_policy_limits,
    get_policy_summary,
    check_single_expense
)

from src.tools.pdf_tool import (
    generate_expense_report
)

from src.tools.email_tool import (
    send_report_email,
    get_finance_contacts
)

__all__ = [
    "retrieve_expenses",
    "retrieve_contacts",
    "retrieve_policies",
    "log_execution",
    "get_execution_logs",
    "calculate_last_month",
    "calculate_date_range",
    "filter_expenses_by_date",
    "parse_natural_date_range",
    "calculate_category_totals",
    "calculate_grand_total",
    "calculate_category_breakdown",
    "summarize_expenses",
    "get_policy_limits",
    "check_policy_limits",
    "get_policy_summary",
    "check_single_expense",
    "generate_expense_report",
    "send_report_email",
    "get_finance_contacts",
]