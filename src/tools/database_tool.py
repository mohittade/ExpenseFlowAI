"""
Database tool for retrieving expenses and contacts.
"""
from typing import List, Dict, Any, Optional
from src.utils.database import get_connection
import sqlite3


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
    """Log an execution step."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO execution_logs (run_id, agent_name, action, status, details)
        VALUES (?, ?, ?, ?, ?)
    """, (run_id, agent_name, action, status, details))

    conn.commit()
    conn.close()


def get_execution_logs(run_id: str) -> List[Dict[str, Any]]:
    """Get execution logs for a run."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM execution_logs WHERE run_id = ? ORDER BY created_at", (run_id,))
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]