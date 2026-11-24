"""
Database tool for retrieving expenses and contacts.
"""
from typing import List, Dict, Any, Optional
from src.utils.database import get_connection
import sqlite3
import logging
from src.logging_config import get_logger, LogContext

logger = get_logger(__name__)


def retrieve_expenses(employee_id: int = 1, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve expenses for an employee, optionally filtered by date range."""
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM expenses WHERE employee_id = ?"
    params = [employee_id]

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    query += " ORDER BY date"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def retrieve_contacts(role: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve contacts, optionally filtered by role."""
    conn = get_connection()
    cursor = conn.cursor()

    if role:
        cursor.execute("SELECT * FROM contacts WHERE role = ?", (role,))
    else:
        cursor.execute("SELECT * FROM contacts")

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def retrieve_policies() -> List[Dict[str, Any]]:
    """Retrieve all expense policies."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM policies")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def log_execution(run_id: str, agent_name: str, action: str, status: str, details: str = "") -> None:
    """Log an execution step to both database and structured logs."""
    # Database logging (retry briefly when another workflow write holds SQLite)
    import time

    last_error = None
    for attempt in range(10):
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO execution_logs (run_id, agent_name, action, status, details)
                VALUES (?, ?, ?, ?, ?)
            """, (run_id, agent_name, action, status, details))
            conn.commit()
            break
        except sqlite3.OperationalError as exc:
            last_error = exc
            if "locked" not in str(exc).lower():
                raise
            time.sleep(0.1 * (attempt + 1))
        finally:
            if conn is not None:
                conn.close()
    else:
        logger.warning(
            "Execution log write skipped because SQLite remained locked",
            extra={"run_id": run_id, "action": action},
        )
    
    # Structured logging with correlation context
    with LogContext(run_id=run_id, agent=agent_name, step=action):
        log_level = logging.INFO if status in ("started", "completed") else logging.ERROR
        logger.log(log_level, f"Agent {agent_name} {action} {status}: {details}")


def get_execution_logs(run_id: str) -> List[Dict[str, Any]]:
    """Get execution logs for a run."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM execution_logs WHERE run_id = ? ORDER BY created_at", (run_id,))
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def get_report_pdf_path(run_id: str) -> Optional[str]:
    """Get the PDF path for a report run."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT details
        FROM execution_logs
        WHERE run_id = ? AND agent_name = 'validation' AND action = 'generate_pdf'
        AND details LIKE '%Report saved to%'
        ORDER BY created_at DESC LIMIT 1
    """, (run_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        details = row['details'] or ''
        marker = 'Report saved to '
        if marker in details:
            return details.split(marker, 1)[1].strip()
    return None