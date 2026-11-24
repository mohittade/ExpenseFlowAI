"""
FastAPI Backend for ExpenseFlow AI with authentication, observability, and resilience.
"""
import sys
import os
import logging
import asyncio
import uuid
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

# OpenTelemetry
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.resources import Resource

# Add project root to path
PROJECT_ROOT = Path(__file__).parent.parent.absolute()
sys.path.insert(0, str(PROJECT_ROOT))

from src.graph.workflow import run_workflow, resume_workflow, get_workflow_state, get_workflow_logs
from src.tools import get_execution_logs
from src.utils.database import init_database
from src.config import get_settings
from src.auth import (
    Token, User, create_access_token, create_refresh_token,
    get_current_active_user, require_scopes, decode_refresh_token,
    SCOPE_READ, SCOPE_WRITE, SCOPE_ADMIN, SCOPE_APPROVE
)
from src.state_store import get_state_store
from src.utils.llm_client import llm_client

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# OpenTelemetry setup
def setup_tracing():
    """Initialize OpenTelemetry tracing."""
    resource = Resource.create({"service.name": settings.service_name})
    provider = TracerProvider(resource=resource)
    
    otlp_exporter = OTLPSpanExporter(endpoint=settings.otel_endpoint, insecure=True)
    provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    
    trace.set_tracer_provider(provider)
    
    # Instrument FastAPI and Redis
    FastAPIInstrumentor().instrument()
    RedisInstrumentor().instrument()
    
    return trace.get_tracer(__name__)


tracer = setup_tracing()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    init_database()
    
    # Initialize state store connection
    store = get_state_store()
    try:
        store.health_check()
        logger.info("Redis connection established")
    except Exception as e:
        logger.warning(f"Redis not available: {e}")
    
    yield
    
    # Shutdown
    store.close()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="ExpenseFlow AI API",
    description="Multi-Agent Autonomous Travel Expense Report System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ExpenseRequest(BaseModel):
    user_request: str
    employee_id: int = 1
    employee_name: str = "Employee"


class ExpenseResponse(BaseModel):
    run_id: str
    current_step: str
    approved: bool
    expenses: List[Dict[str, Any]]
    summary: Dict[str, Any]
    violations: List[Dict[str, Any]]
    missing_data: List[Dict[str, Any]]
    pdf_path: Optional[str] = None
    email_result: Dict[str, Any]
    error: Optional[str] = None


class ApprovalRequest(BaseModel):
    run_id: str
    approved: bool


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ContactUpdate(BaseModel):
    email: str
    department: Optional[str] = None
    role: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    services: Dict[str, bool]
    version: str = "1.0.0"


# Authentication Endpoints
@app.post("/api/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible login endpoint."""
    from src.auth import USERS_DB, verify_password
    
    # Try to find user by username or email
    username_or_email = form_data.username
    user = USERS_DB.get(username_or_email)
    
    # If not found by username, try to find by email
    if not user:
        for u in USERS_DB.values():
            if u.email == username_or_email:
                user = u
                break
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username, "scopes": user.scopes}
    )
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    return Token(access_token=access_token, refresh_token=refresh_token)


@app.post("/api/auth/refresh", response_model=Token)
async def refresh_token(request: RefreshRequest):
    """Refresh access token using refresh token."""
    username = decode_refresh_token(request.refresh_token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    from src.auth import USERS_DB
    user = USERS_DB.get(username)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    access_token = create_access_token(
        data={"sub": user.username, "scopes": user.scopes}
    )
    new_refresh_token = create_refresh_token(data={"sub": user.username})
    
    return Token(access_token=access_token, refresh_token=new_refresh_token)


@app.get("/api/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user


# Health Check Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check."""
    store = get_state_store()
    
    services = {
        "redis": store.health_check(),
        "llm": llm_client.health_check(),
        "database": True,  # SQLite always available
    }
    
    overall_status = "healthy" if all(services.values()) else "degraded"
    
    return HealthResponse(status=overall_status, services=services)


@app.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe."""
    store = get_state_store()
    if not store.health_check():
        raise HTTPException(status_code=503, detail="Redis not ready")
    return {"status": "ready"}


@app.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"status": "alive"}


# Agent Health Endpoints
@app.get("/api/agents/health")
async def agents_health(current_user: User = Depends(require_scopes([SCOPE_READ]))):
    """Health check for all agents."""
    from src.agents import (
        SupervisorAgent,
        ExpenseIntelligenceAgent,
        ExceptionAgent,
        ValidationAgent
    )
    
    agents = {
        "supervisor": SupervisorAgent(),
        "expense_intelligence": ExpenseIntelligenceAgent(),
        "exception": ExceptionAgent(),
        "validation": ValidationAgent(),
    }
    
    results = {}
    for name, agent in agents.items():
        try:
            # Basic instantiation check
            results[name] = {"status": "healthy", "agent": name}
        except Exception as e:
            results[name] = {"status": "unhealthy", "agent": name, "error": str(e)}
    
    return {"agents": results}


# Workflow Endpoints
@app.post("/api/generate-report", response_model=ExpenseResponse)
async def generate_report(
    request: ExpenseRequest,
    current_user: User = Depends(require_scopes([SCOPE_WRITE]))
):
    """Generate an expense report synchronously and return the completed result."""
    with tracer.start_as_current_span("generate_report") as span:
        span.set_attribute("user_request", request.user_request)
        span.set_attribute("employee_id", request.employee_id)
        try:
            result = await asyncio.to_thread(
                run_workflow,
                user_request=request.user_request,
                employee_id=request.employee_id,
                employee_name=request.employee_name,
            )
            span.set_attribute("run_id", result.get("run_id", ""))
            span.set_attribute("success", True)
            return ExpenseResponse(**result)
        except Exception as exc:
            span.set_attribute("success", False)
            span.set_attribute("error", str(exc))
            logger.error("Workflow failed: %s", exc, exc_info=True)
            raise HTTPException(status_code=500, detail=str(exc))


@app.post("/api/approve-report")
async def approve_report(
    request: ApprovalRequest,
    current_user: User = Depends(require_scopes([SCOPE_APPROVE]))
):
    """Approve or reject a report (human-in-the-loop)."""
    with tracer.start_as_current_span("approve_report") as span:
        span.set_attribute("run_id", request.run_id)
        span.set_attribute("approved", request.approved)

        from src.utils.database import get_connection

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT run_id FROM reports WHERE run_id = ?", (request.run_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Report not found")

        status = "completed" if request.approved else "rejected"
        cursor.execute(
            "UPDATE reports SET status = ? WHERE run_id = ?",
            (status, request.run_id),
        )
        conn.commit()
        conn.close()

        store = get_state_store()
        state = store.load_state(request.run_id)
        if state:
            state["approved"] = request.approved
            state["current_step"] = "approval_received"
            store.save_state(request.run_id, state)

        if request.approved:
            from src.tools.database_tool import get_report_pdf_path
            from src.tools.email_tool import send_report_email, resolve_recipient_contacts

            pdf_path = get_report_pdf_path(request.run_id)
            if pdf_path and not os.path.isabs(pdf_path):
                pdf_path = str(PROJECT_ROOT / pdf_path)

            recipient_text = state.get("user_request", "") if state else ""
            recipient_emails = resolve_recipient_contacts(recipient_text)
            if not recipient_emails:
                recipient_emails = ["finance@company.com"]
            employee_name = state.get("employee_name", "Employee") if state else "Employee"
            subject = f"Approved Expense Report — {employee_name} (Run: {request.run_id[:8]})"
            body = (
                "<html><body>"
                "<h2>Expense Report Approved</h2>"
                f"<p>The expense report for <strong>{employee_name}</strong> has been approved.</p>"
                f"<p><strong>Run ID:</strong> {request.run_id}</p>"
                "</body></html>"
            )
            email_result = send_report_email(
                to_emails=recipient_emails,
                subject=subject,
                body=body,
                attachment_path=pdf_path if pdf_path and os.path.exists(pdf_path) else None,
            )
            if email_result.get("success"):
                return {
                    "success": True,
                    "message": "Report approved and emailed",
                    "run_id": request.run_id,
                }
            return {
                "success": True,
                "message": "Report approved but email failed",
                "run_id": request.run_id,
                "email_error": email_result.get("error", "Unknown email error"),
            }

        return {
            "success": True,
            "message": "Report approved" if request.approved else "Report rejected",
            "run_id": request.run_id,
        }


@app.get("/api/workflow/{run_id}/state")
async def get_workflow_state_endpoint(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Get current workflow state."""
    state = get_workflow_state(run_id)
    if not state:
        from src.utils.database import get_connection

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT run_id, status, period_start, period_end, total_amount, pdf_path, created_at FROM reports WHERE run_id = ?",
            (run_id,),
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {
                "run_id": run_id,
                "current_step": "request_approval" if row["status"] == "pending_approval" else "send_email",
                "approved": row["status"] == "completed",
                "error": "",
                "pdf_path": row["pdf_path"],
            }

        raise HTTPException(status_code=404, detail="Workflow not found")
    return state


@app.get("/api/workflow/{run_id}/logs")
async def get_workflow_logs_endpoint(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Get workflow execution logs."""
    logs = get_workflow_logs(run_id)
    return {"run_id": run_id, "logs": logs}


@app.post("/api/workflow/{run_id}/resume")
async def resume_workflow_endpoint(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_WRITE]))
):
    """Resume a paused workflow."""
    result = resume_workflow(run_id)
    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found or cannot be resumed")
    return result


@app.get("/api/logs/{run_id}")
async def get_logs(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Get execution logs for a run (legacy endpoint)."""
    logs = get_execution_logs(run_id)
    return {"run_id": run_id, "logs": logs}


@app.get("/api/sample-requests")
async def get_sample_requests(
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Get sample requests for testing."""
    return {
        "samples": [
            "Generate my travel expense report for July 2025 and email it to finance.",
            "Create expense report for last month.",
            "Generate travel expense report for August 2025.",
            "Create my expense report for July 2025.",
        ]
    }


@app.get("/api/download-report/{run_id}")
async def download_report(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Download PDF report for a run."""
    from src.tools.database_tool import get_report_pdf_path
    
    pdf_path = get_report_pdf_path(run_id)
    if pdf_path and not os.path.isabs(pdf_path):
        pdf_path = str(PROJECT_ROOT / pdf_path)
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=f"expense_report_{run_id}.pdf"
    )


@app.post("/api/send-report-email/{run_id}")
async def send_report_email_endpoint(
    run_id: str,
    current_user: User = Depends(require_scopes([SCOPE_APPROVE]))
):
    """Send approved expense report via email to finance team."""
    from src.tools.database_tool import get_report_pdf_path
    from src.tools.email_tool import send_report_email, resolve_recipient_contacts

    # Verify the report exists
    store = get_state_store()
    state = store.load_state(run_id)
    if not state:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if not state.get("approved"):
        raise HTTPException(status_code=400, detail="Report must be approved before emailing")

    # Resolve PDF path
    pdf_path = get_report_pdf_path(run_id)
    if pdf_path and not os.path.isabs(pdf_path):
        pdf_path = str(PROJECT_ROOT / pdf_path)

    # Get finance contacts
    recipient_emails = resolve_recipient_contacts(state.get("user_request", ""))
    if not recipient_emails:
        recipient_emails = ["finance@company.com"]

    employee_name = state.get("employee_name", "Employee")
    subject = f"Approved Expense Report — {employee_name} (Run: {run_id[:8]})"
    body = f"""
    <html><body>
    <h2>Expense Report Approved</h2>
    <p>The expense report for <strong>{employee_name}</strong> has been approved and is attached.</p>
    <p><strong>Run ID:</strong> {run_id}</p>
    <p>Please review and process the reimbursement at your earliest convenience.</p>
    <br/>
    <p>— ExpenseFlow AI</p>
    </body></html>
    """

    result = send_report_email(
        to_emails=recipient_emails,
        subject=subject,
        body=body,
        attachment_path=pdf_path if pdf_path and os.path.exists(pdf_path) else None,
    )

    if result.get("success"):
        logger.info(f"Report email sent for run_id={run_id} to {recipient_emails}")
        return {"success": True, "message": f"Email sent to {', '.join(recipient_emails)}"}
    else:
        logger.warning(f"Report email failed for run_id={run_id}: {result.get('error')}")
        return {"success": False, "error": result.get("error", "Unknown error")}


# Root endpoint
@app.get("/")
async def root():
    return {"message": "ExpenseFlow AI API", "version": "1.0.0"}


@app.get("/api/contacts")
async def get_contacts(
    current_user: User = Depends(require_scopes([SCOPE_READ]))
):
    """Get contacts available for email routing."""
    from src.utils.database import get_connection

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, email, department, role
        FROM contacts
        ORDER BY name
    """)
    rows = cursor.fetchall()
    conn.close()

    return {
        "contacts": [dict(row) for row in rows]
    }


@app.put("/api/contacts/{contact_id}")
async def update_contact(
    contact_id: int,
    update: ContactUpdate,
    current_user: User = Depends(require_scopes([SCOPE_ADMIN]))
):
    """Update a contact email and optional routing fields."""
    email = update.email.strip()
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="A valid email address is required")

    from src.utils.database import get_connection

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM contacts WHERE id = ?", (contact_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Contact not found")

    cursor.execute("""
        UPDATE contacts
        SET email = ?,
            department = COALESCE(?, department),
            role = COALESCE(?, role)
        WHERE id = ?
    """, (email, update.department, update.role, contact_id))
    conn.commit()

    cursor.execute("""
        SELECT id, name, email, department, role
        FROM contacts
        WHERE id = ?
    """, (contact_id,))
    contact = cursor.fetchone()
    conn.close()

    return {"success": True, "contact": dict(contact)}


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.get("/api/reports")
async def get_reports(
    current_user: User = Depends(require_scopes([SCOPE_READ])),
    limit: int = 50,
    offset: int = 0
):
    """Get expense reports from database."""
    from src.utils.database import get_connection
    
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT r.run_id, r.employee_id, r.period_start, r.period_end, 
               r.total_amount, r.pdf_path, r.status, r.created_at,
               e.name as employee_name
        FROM reports r
        LEFT JOIN contacts e ON r.employee_id = e.id
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    """, (limit, offset))
    rows = cursor.fetchall()
    
    # Get violations and missing data counts for each report
    reports = []
    for row in rows:
        cursor.execute("""
            SELECT COUNT(*) FROM execution_logs 
            WHERE run_id = ? AND agent_name = 'validation' AND action = 'check_policy' 
            AND details LIKE '%violations%'
        """, (row['run_id'],))
        violations_row = cursor.fetchone()
        violations_count = violations_row[0] if violations_row else 0
        
        cursor.execute("""
            SELECT COUNT(*) FROM execution_logs 
            WHERE run_id = ? AND agent_name = 'exception' AND action = 'check_missing' 
            AND details LIKE '%issues%'
        """, (row['run_id'],))
        missing_data_row = cursor.fetchone()
        missing_data_count = missing_data_row[0] if missing_data_row else 0
        
        reports.append({
            "run_id": row['run_id'],
            "employee_id": row['employee_id'],
            "employee_name": row['employee_name'],
            "period_start": row['period_start'],
            "period_end": row['period_end'],
            "total_amount": row['total_amount'],
            "status": row['status'],
            "created_at": row['created_at'],
            "pdf_path": row['pdf_path'],
            "violations_count": violations_count,
            "missing_data_count": missing_data_count,
        })
    
    conn.close()
    return {"reports": reports, "total": len(reports)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port, workers=settings.api_workers)