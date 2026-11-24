"""
LangGraph workflow for ExpenseFlow AI with persistent state.
"""
import uuid
import logging
from typing import Dict, Any, List, TypedDict, Optional
from langgraph.graph import StateGraph, END
from src.agents import (
    SupervisorAgent,
    ExpenseIntelligenceAgent,
    ExceptionAgent,
    ValidationAgent
)
from src.tools import log_execution
logger = logging.getLogger(__name__)


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


def _save_state(state: WorkflowState):
    """Workflow state is persisted in SQLite."""
    return None


def _log_step(run_id: str, step: str, status: str, details: str = ""):
    """Log workflow step."""
    log_execution(run_id, "workflow", step, status, details)


def parse_request(state: WorkflowState) -> WorkflowState:
    """Parse user request and create execution plan."""
    run_id = state.get("run_id") or str(uuid.uuid4())[:8]
    state["run_id"] = run_id
    state["current_step"] = "parse_request"

    _log_step(run_id, "parse_request", "started", f"Planning for: {state['user_request']}")

    result = supervisor.plan(state["user_request"], run_id)
    state["plan"] = result.get("plan", [])
    state["date_range"] = result.get("date_range", "last month")

    _log_step(run_id, "parse_request", "completed", f"Plan created with {len(state['plan'])} steps")
    _save_state(state)
    return state


def retrieve_expenses(state: WorkflowState) -> WorkflowState:
    """Retrieve and filter expenses by date range."""
    state["current_step"] = "retrieve_expenses"
    run_id = state["run_id"]

    _log_step(run_id, "retrieve_expenses", "started", f"Date range: {state.get('date_range')}")

    date_desc = state.get("date_range", "last month")
    employee_id = state.get("employee_id", 1)

    result = expense_intel.retrieve_and_filter(
        run_id,
        date_desc,
        employee_id,
        state.get("user_request", ""),
    )
    state["expenses"] = result["expenses"]
    state["date_range"] = result["date_range"]

    _log_step(run_id, "retrieve_expenses", "completed", f"Retrieved {len(state['expenses'])} expenses")
    _save_state(state)
    return state


def categorize_expenses(state: WorkflowState) -> WorkflowState:
    """Categorize uncategorized expenses."""
    state["current_step"] = "categorize_expenses"
    run_id = state["run_id"]

    _log_step(run_id, "categorize_expenses", "started", f"Categorizing {len(state['expenses'])} expenses")

    result = expense_intel.categorize_expenses(run_id, state["expenses"])
    state["expenses"] = result["updated_expenses"]

    _log_step(run_id, "categorize_expenses", "completed", f"Categorized {len(result['categorized'])} expenses")
    _save_state(state)
    return state


def check_missing_data(state: WorkflowState) -> WorkflowState:
    """Check for missing data in expenses."""
    state["current_step"] = "check_missing_data"
    run_id = state["run_id"]

    _log_step(run_id, "check_missing_data", "started", f"Checking {len(state['expenses'])} expenses")

    result = exception_agent.check_missing_data(run_id, state["expenses"])
    state["missing_data"] = result["missing_data"]
    state["requires_human"] = result["requires_human"]

    _log_step(run_id, "check_missing_data", "completed", f"Found {len(state['missing_data'])} issues")
    _save_state(state)
    return state


def validate_policies(state: WorkflowState) -> WorkflowState:
    """Validate expenses against policies."""
    state["current_step"] = "validate_policies"
    run_id = state["run_id"]

    _log_step(run_id, "validate_policies", "started", f"Validating {len(state['expenses'])} expenses")

    result = validation_agent.validate_policies(run_id, state["expenses"])
    state["violations"] = result["violations"]

    _log_step(run_id, "validate_policies", "completed", f"Found {len(state['violations'])} violations")
    _save_state(state)
    return state


def calculate_totals(state: WorkflowState) -> WorkflowState:
    """Calculate expense totals."""
    state["current_step"] = "calculate_totals"
    run_id = state["run_id"]

    _log_step(run_id, "calculate_totals", "started", "Calculating totals")

    result = validation_agent.calculate_totals(run_id, state["expenses"])
    state["summary"] = result

    _log_step(run_id, "calculate_totals", "completed", f"Grand total: {result.get('grand_total', 0)}")
    _save_state(state)
    return state


def generate_pdf(state: WorkflowState) -> WorkflowState:
    """Generate PDF report."""
    state["current_step"] = "generate_pdf"
    run_id = state["run_id"]

    _log_step(run_id, "generate_pdf", "started", "Generating PDF report")

    employee_name = state.get("employee_name", "Employee")
    employee_id = state.get("employee_id", 1)
    date_range = state.get("date_range", {})
    period_start = date_range.get("start", "")
    period_end = date_range.get("end", "")
    state["summary"]["date_range"] = {
        "start": period_start,
        "end": period_end,
    }
    result = validation_agent.generate_report(
        run_id,
        state["expenses"],
        state["summary"],
        state["violations"],
        state["missing_data"],
        employee_id,
        period_start,
        period_end,
        employee_name
    )
    state["pdf_path"] = result["pdf_path"]

    _log_step(run_id, "generate_pdf", "completed", f"Report saved to {state['pdf_path']}")
    _save_state(state)
    return state


def validate_report(state: WorkflowState) -> WorkflowState:
    """Validate the generated report."""
    state["current_step"] = "validate_report"
    run_id = state["run_id"]

    _log_step(run_id, "validate_report", "started", "Validating report")

    result = validation_agent.validate_report(run_id, state["pdf_path"], state["summary"])
    if not result["valid"]:
        state["error"] = f"Report validation failed: {result['issues']}"
        _log_step(run_id, "validate_report", "failed", state["error"])
    else:
        _log_step(run_id, "validate_report", "completed", "Report valid")

    _save_state(state)
    return state


def request_approval(state: WorkflowState) -> WorkflowState:
    """Request human approval."""
    state["current_step"] = "request_approval"
    run_id = state["run_id"]

    _log_step(run_id, "request_approval", "started", "Requesting human approval")
    state["approved"] = False
    state["email_result"] = {"success": False, "error": "Waiting for human approval"}

    _log_step(run_id, "request_approval", "completed", "Waiting for human approval")
    _save_state(state)
    return state


def send_email(state: WorkflowState) -> WorkflowState:
    """Send report via email."""
    if not state.get("approved"):
        state["current_step"] = "request_approval"
        state["email_result"] = {"success": False, "error": "Waiting for human approval"}
        _save_state(state)
        return state

    state["current_step"] = "send_email"
    run_id = state["run_id"]

    _log_step(run_id, "send_email", "started", "Sending report email")

    if state.get("approved"):
        from src.config import get_settings
        settings = get_settings()
        to_emails = [settings.finance_email]
        result = supervisor.send_email(run_id, state["pdf_path"], to_emails)
        state["email_result"] = result
    else:
        state["email_result"] = {"success": False, "error": "Not approved"}

    _log_step(run_id, "send_email", "completed" if state["email_result"].get("success") else "failed", str(state["email_result"]))
    _save_state(state)
    return state


def should_continue(state: WorkflowState) -> str:
    """Decide whether to continue or handle error."""
    if state.get("error"):
        return "error"
    return "continue"


def handle_error(state: WorkflowState) -> WorkflowState:
    """Handle workflow error."""
    run_id = state["run_id"]
    state["current_step"] = "error"
    error_msg = state.get("error", "Unknown error")
    _log_step(run_id, "error", "failed", error_msg)
    _save_state(state)
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


def run_workflow(user_request: str, employee_id: int = 1, employee_name: str = "Employee", run_id: str = "") -> Dict[str, Any]:
    """Run the complete expense report workflow."""
    initial_state = WorkflowState(
        run_id=run_id,
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


def resume_workflow(run_id: str) -> Optional[Dict[str, Any]]:
    """Resume workflow from persisted state."""
    store = get_state_store()
    state = store.load_state(run_id)
    if not state:
        return None
    result = app.invoke(state)
    return result


def get_workflow_state(run_id: str) -> Optional[Dict[str, Any]]:
    """Get current workflow state."""
    store = get_state_store()
    return store.load_state(run_id)


def get_workflow_logs(run_id: str) -> List[Dict[str, Any]]:
    """Get workflow execution logs."""
    store = get_state_store()
    return store.get_logs(run_id)