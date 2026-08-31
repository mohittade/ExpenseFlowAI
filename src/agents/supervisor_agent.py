"""
Supervisor & Planning Agent.
"""
from typing import Dict, Any, List
from src.utils.llm_client import llm_client
from src.tools import log_execution


class SupervisorAgent:
    """Supervisor agent that plans and orchestrates the workflow."""

    def __init__(self):
        self.name = "supervisor"

    def plan(self, user_request: str, run_id: str) -> Dict[str, Any]:
        """Create an execution plan from user request."""
        log_execution(run_id, self.name, "plan", "started", f"Planning for: {user_request}")

        messages = [
            {"role": "system", "content": """You are a planning agent for an expense report system.
Given a user request, create a step-by-step execution plan.
Return JSON with:
- plan: array of steps, each with step number, agent, action, description
- date_range: extracted date range description (e.g., "last month", "July 2025")"""},
            {"role": "user", "content": f"User request: {user_request}"}
        ]

        result = llm_client.chat_json(messages)
        log_execution(run_id, self.name, "plan", "completed", f"Plan created with {len(result.get('plan', []))} steps")
        return result

    def request_approval(self, run_id: str, report_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Request human approval for the report."""
        log_execution(run_id, self.name, "request_approval", "started", "Requesting human approval")

        # In a real system, this would integrate with a UI or notification system
        # For now, we'll simulate with LLM
        messages = [
            {"role": "system", "content": """You are simulating a human approver.
Review the expense report summary and decide to approve or reject.
Return JSON with: approved (bool), feedback (string)"""},
            {"role": "user", "content": f"Report summary: {report_summary}"}
        ]

        result = llm_client.chat_json(messages)
        log_execution(run_id, self.name, "request_approval", "completed", f"Approval: {result.get('approved')}")
        return result

    def send_email(self, run_id: str, pdf_path: str, to_emails: List[str]) -> Dict[str, Any]:
        """Send the report via email."""
        log_execution(run_id, self.name, "send_email", "started", f"Sending to {to_emails}")

        from src.tools import send_report_email, get_finance_contacts

        if not to_emails:
            to_emails = get_finance_contacts()

        subject = "Travel Expense Report"
        body = f"""
        <html>
        <body>
        <h2>Travel Expense Report</h2>
        <p>Please find attached the travel expense report.</p>
        <p>This report was generated automatically by ExpenseFlow AI.</p>
        </body>
        </html>
        """

        result = send_report_email(to_emails, subject, body, pdf_path)
        log_execution(run_id, self.name, "send_email", "completed" if result["success"] else "failed", str(result))
        return result