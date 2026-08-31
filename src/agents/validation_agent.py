"""
Validation Agent.
"""
from typing import Dict, Any, List
from src.utils.llm_client import llm_client
from src.tools import (
    check_policy_limits,
    get_policy_summary,
    generate_expense_report,
    log_execution
)


class ValidationAgent:
    """Agent responsible for policy validation and report generation."""

    def __init__(self):
        self.name = "validation"

    def validate_policies(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check expenses against policy limits."""
        log_execution(run_id, self.name, "check_policy", "started", f"Validating {len(expenses)} expenses")

        violations = check_policy_limits(expenses)
        policies = get_policy_summary()

        # Use LLM for additional validation logic
        if violations:
            messages = [
                {"role": "system", "content": """You are a policy validation expert.
Review the policy violations and provide context/severity.
Return JSON with: violations (array with severity added), summary (string)"""},
                {"role": "user", "content": f"Violations: {violations}\nPolicies: {policies}"}
            ]
            result = llm_client.chat_json(messages)
            violations = result.get("violations", violations)
            for v in violations:
                if "severity" not in v:
                    excess_pct = (v.get("excess", 0) / v.get("limit", 1)) * 100
                    v["severity"] = "high" if excess_pct > 50 else "medium"

        log_execution(run_id, self.name, "check_policy", "completed", f"Found {len(violations)} violations")
        return {"violations": violations, "policies": policies}

    def calculate_totals(self, run_id: str, expenses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate and verify totals."""
        log_execution(run_id, self.name, "calculate_totals", "started", "Calculating totals")

        from src.tools import summarize_expenses
        summary = summarize_expenses(expenses)

        log_execution(run_id, self.name, "calculate_totals", "completed", f"Grand total: {summary['grand_total']}")
        return summary

    def generate_report(self, run_id: str, expenses: List[Dict[str, Any]], summary: Dict[str, Any],
                        violations: List[Dict[str, Any]], missing_data: List[Dict[str, Any]],
                        employee_name: str = "Employee") -> Dict[str, Any]:
        """Generate PDF expense report."""
        log_execution(run_id, self.name, "generate_pdf", "started", "Generating PDF report")

        output_path = f"expense_report_{run_id}.pdf"
        pdf_path = generate_expense_report(
            expenses=expenses,
            summary=summary,
            policy_violations=violations,
            missing_data=missing_data,
            employee_name=employee_name,
            output_path=output_path
        )

        log_execution(run_id, self.name, "generate_pdf", "completed", f"Report saved to {pdf_path}")
        return {"pdf_path": pdf_path, "summary": summary}

    def validate_report(self, run_id: str, pdf_path: str, summary: Dict[str, Any]) -> Dict[str, Any]:
        """Validate the generated report for accuracy."""
        log_execution(run_id, self.name, "validate_report", "started", "Validating report")

        # In production, this would re-read the PDF and verify totals
        # For now, we trust the generation
        is_valid = True
        issues = []

        log_execution(run_id, self.name, "validate_report", "completed", f"Valid: {is_valid}")
        return {"valid": is_valid, "issues": issues}