"""
LangGraph workflow for ExpenseFlow AI.
"""
from typing import Dict, Any, List, TypedDict
from langgraph.graph import StateGraph, END
from src.agents import (
    SupervisorAgent,
    ExpenseIntelligenceAgent,
    ExceptionAgent,
    ValidationAgent
)
from src.tools import log_execution
import uuid


class WorkflowState(TypedDict):
    """State passed between workflow nodes."""
    run_id: str
    user_request: str
    employee_id: int
    employee_name: str
    plan: List[Dict[str, Any]]
    date_range: Dict[str, str]
    expenses: List[Dict[str, Any]]
    summary: Dict[str, Any]
    missing_data: List[Dict[str, Any]]
    requires_human: bool
    violations: List[Dict[str, Any]]
    pdf_path: str
    approved: bool
    email_result: Dict[str, Any]
    current_step: str
    error: str


# Initialize agents
supervisor = SupervisorAgent()
expense_intel = ExpenseIntelligenceAgent()
exception_agent = ExceptionAgent()
validation_agent = ValidationAgent()


def parse_request(state: WorkflowState) -> WorkflowState:
    """Parse user request and create execution plan."""
    run_id = state.get("run_id") or str(uuid.uuid4())[:8]
    state["run_id"] = run_id
    state["current_step"] = "parse_request"

    result = supervisor.plan(state["user_request"], run_id)
    state["plan"] = result.get("plan", [])
    state["date_range"] = result.get("date_range", "last month")

    return state


def retrieve_expenses(state: WorkflowState) -> WorkflowState:
    """Retrieve and filter expenses by date range."""
    state["current_step"] = "retrieve_expenses"

    date_desc = state.get("date_range", "last month")
    employee_id = state.get("employee_id", 1)

    result = expense_intel.retrieve_and_filter(state["run_id"], date_desc, employee_id)
    state["expenses"] = result["expenses"]
    state["date_range"] = result["date_range"]

    return state


def categorize_expenses(state: WorkflowState) -> WorkflowState:
    """Categorize uncategorized expenses."""
    state["current_step"] = "categorize_expenses"

    result = expense_intel.categorize_expenses(state["run_id"], state["expenses"])
    state["expenses"] = result["updated_expenses"]

    return state


def check_missing_data(state: WorkflowState) -> WorkflowState:
    """Check for missing data in expenses."""
    state["current_step"] = "check_missing_data"

    result = exception_agent.check_missing_data(state["run_id"], state["expenses"])
    state["missing_data"] = result["missing_data"]
    state["requires_human"] = result["requires_human"]

    return state


def validate_policies(state: WorkflowState) -> WorkflowState:
    """Validate expenses against policies."""
    state["current_step"] = "validate_policies"

    result = validation_agent.validate_policies(state["run_id"], state["expenses"])
    state["violations"] = result["violations"]

    return state


def calculate_totals(state: WorkflowState) -> WorkflowState:
    """Calculate expense totals."""
    state["current_step"] = "calculate_totals"

    result = validation_agent.calculate_totals(state["run_id"], state["expenses"])
    state["summary"] = result

    return state


def generate_pdf(state: WorkflowState) -> WorkflowState:
    """Generate PDF report."""
    state["current_step"] = "generate_pdf"

    employee_name = state.get("employee_name", "Employee")
    result = validation_agent.generate_report(
        state["run_id"],
        state["expenses"],
        state["summary"],
        state["violations"],
        state["missing_data"],
        employee_name
    )
    state["pdf_path"] = result["pdf_path"]

    return state


def validate_report(state: WorkflowState) -> WorkflowState:
    """Validate the generated report."""
    state["current_step"] = "validate_report"

    result = validation_agent.validate_report(state["run_id"], state["pdf_path"], state["summary"])
    if not result["valid"]:
        state["error"] = f"Report validation failed: {result['issues']}"

    return state


def request_approval(state: WorkflowState) -> WorkflowState:
    """Request human approval."""
    state["current_step"] = "request_approval"

    if state.get("requires_human") or state.get("violations"):
        result = supervisor.request_approval(state["run_id"], state["summary"])
        state["approved"] = result.get("approved", False)
    else:
        state["approved"] = True

    return state


def send_email(state: WorkflowState) -> WorkflowState:
    """Send report via email."""
    state["current_step"] = "send_email"

    if state.get("approved"):
        to_emails = ["finance@company.com"]  # Could be dynamic
        result = supervisor.send_email(state["run_id"], state["pdf_path"], to_emails)
        state["email_result"] = result
    else:
        state["email_result"] = {"success": False, "error": "Not approved"}

    return state


def should_continue(state: WorkflowState) -> str:
    """Decide whether to continue or handle error."""
    if state.get("error"):
        return "error"
    return "continue"


def handle_error(state: WorkflowState) -> WorkflowState:
    """Handle workflow error."""
    state["current_step"] = "error"
    log_execution(state["run_id"], "workflow", "error", "failed", state.get("error", "Unknown error"))
    return state


# Build the workflow graph
workflow = StateGraph(WorkflowState)

# Add nodes
workflow.add_node("parse_request", parse_request)
workflow.add_node("retrieve_expenses", retrieve_expenses)
workflow.add_node("categorize_expenses", categorize_expenses)
workflow.add_node("check_missing_data", check_missing_data)
workflow.add_node("validate_policies", validate_policies)
workflow.add_node("calculate_totals", calculate_totals)
workflow.add_node("generate_pdf", generate_pdf)
workflow.add_node("validate_report", validate_report)
workflow.add_node("request_approval", request_approval)
workflow.add_node("send_email", send_email)
workflow.add_node("error", handle_error)

# Add edges
workflow.set_entry_point("parse_request")
workflow.add_edge("parse_request", "retrieve_expenses")
workflow.add_edge("retrieve_expenses", "categorize_expenses")
workflow.add_edge("categorize_expenses", "check_missing_data")
workflow.add_edge("check_missing_data", "validate_policies")
workflow.add_edge("validate_policies", "calculate_totals")
workflow.add_edge("calculate_totals", "generate_pdf")
workflow.add_edge("generate_pdf", "validate_report")

# Conditional routing after validation
workflow.add_conditional_edges(
    "validate_report",
    should_continue,
    {"continue": "request_approval", "error": "error"}
)

workflow.add_edge("request_approval", "send_email")
workflow.add_edge("send_email", END)
workflow.add_edge("error", END)

# Compile the graph
app = workflow.compile()


def run_workflow(user_request: str, employee_id: int = 1, employee_name: str = "Employee") -> Dict[str, Any]:
    """Run the complete expense report workflow."""
    initial_state = WorkflowState(
        run_id="",
        user_request=user_request,
        employee_id=employee_id,
        employee_name=employee_name,
        plan=[],
        date_range={},
        expenses=[],
        summary={},
        missing_data=[],
        requires_human=False,
        violations=[],
        pdf_path="",
        approved=False,
        email_result={},
        current_step="",
        error=""
    )

    result = app.invoke(initial_state)
    return result