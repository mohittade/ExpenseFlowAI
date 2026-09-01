"""
Database setup and connection utilities.
"""
import sqlite3
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_PATH", "expenseflow.db")


def get_connection():
    """Get a database connection with lock retry support for concurrent app usage."""
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout = 30000")
    return conn


def _ensure_execution_logs_schema(cursor):
    """Upgrade older execution_logs tables to the current schema."""
    cursor.execute("PRAGMA table_info(execution_logs)")
    columns = [row[1] for row in cursor.fetchall()]

    if not columns:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT NOT NULL,
                agent_name TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        return

    for column_name, column_sql in {
        "run_id": "ALTER TABLE execution_logs ADD COLUMN run_id TEXT NOT NULL DEFAULT 'legacy'",
        "agent_name": "ALTER TABLE execution_logs ADD COLUMN agent_name TEXT NOT NULL DEFAULT 'unknown'",
        "action": "ALTER TABLE execution_logs ADD COLUMN action TEXT NOT NULL DEFAULT 'unknown'",
        "status": "ALTER TABLE execution_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'unknown'",
        "details": "ALTER TABLE execution_logs ADD COLUMN details TEXT",
        "created_at": "ALTER TABLE execution_logs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    }.items():
        if column_name not in columns:
            cursor.execute(column_sql)


def init_database():
    """Initialize database with required tables and sample data."""
    conn = get_connection()
    cursor = conn.cursor()

    # Create expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            merchant TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT,
            description TEXT,
            receipt_path TEXT,
            employee_id INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create contacts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            department TEXT,
            role TEXT
        )
    """)

    # Create policies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            max_amount REAL NOT NULL,
            description TEXT
        )
    """)

    # Create execution_logs table and migrate older versions
    _ensure_execution_logs_schema(cursor)

    conn.commit()

    # Insert sample data if tables are empty
    _insert_sample_data(cursor)
    conn.commit()
    conn.close()


def _insert_sample_data(cursor):
    """Insert sample data for testing."""
    # Check if expenses table is empty
    cursor.execute("SELECT COUNT(*) FROM expenses")
    if cursor.fetchone()[0] == 0:
        sample_expenses = [
            ("2025-07-03", "Delta Airlines", 450.00, "Flights", "Flight to NYC for conference", None, 1),
            ("2025-07-05", "Marriott Hotel", 320.00, "Lodging", "Hotel stay 2 nights", None, 1),
            ("2025-07-06", "Uber", 45.00, "Transport", "Airport to hotel", None, 1),
            ("2025-07-07", "Uber", 38.00, "Transport", "Hotel to client site", None, 1),
            ("2025-07-08", "Per Se Restaurant", 180.00, "Meals", "Client dinner", None, 1),
            ("2025-07-09", "Delta Airlines", 420.00, "Flights", "Return flight", None, 1),
            ("2025-07-15", "Amazon", 89.99, "Supplies", "Office supplies", None, 1),
            ("2025-07-20", "Lyft", 25.00, "Transport", "Local travel", None, 1),
            ("2025-07-22", "Chipotle", 28.50, "Meals", "Lunch meeting", None, 1),
            ("2025-08-05", "Southwest Airlines", 380.00, "Flights", "Flight to Chicago", None, 1),
            ("2025-08-06", "Hilton Hotel", 275.00, "Lodging", "Hotel stay 1 night", None, 1),
            ("2025-08-07", "Enterprise", 120.00, "Transport", "Car rental", None, 1),
            ("2025-08-08", "Lou Malnati's", 45.00, "Meals", "Team dinner", None, 1),
            ("2025-08-10", "Southwest Airlines", 360.00, "Flights", "Return flight", None, 1),
            # Some expenses with missing data for testing exception handling
            ("2025-07-12", "Unknown Merchant", 150.00, None, "No category assigned", None, 1),
            ("2025-07-18", "Taxi", 55.00, "Transport", None, None, 1),  # missing description
            ("2025-08-15", "Conference Fee", 500.00, "Registration", "Tech conference", None, 1),
        ]
        cursor.executemany("""
            INSERT INTO expenses (date, merchant, amount, category, description, receipt_path, employee_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, sample_expenses)

    # Check if contacts table is empty
    cursor.execute("SELECT COUNT(*) FROM contacts")
    if cursor.fetchone()[0] == 0:
        sample_contacts = [
            ("Finance Team", "finance@company.com", "Finance", "Approver"),
            ("John Smith", "john.smith@company.com", "Engineering", "Employee"),
            ("Jane Doe", "jane.doe@company.com", "Sales", "Employee"),
            ("Manager", "manager@company.com", "Management", "Approver"),
        ]
        cursor.executemany("""
            INSERT INTO contacts (name, email, department, role)
            VALUES (?, ?, ?, ?)
        """, sample_contacts)

    # Check if policies table is empty
    cursor.execute("SELECT COUNT(*) FROM policies")
    if cursor.fetchone()[0] == 0:
        sample_policies = [
            ("Flights", 600.00, "Maximum per flight"),
            ("Lodging", 300.00, "Maximum per night"),
            ("Meals", 75.00, "Maximum per meal"),
            ("Transport", 100.00, "Maximum per trip"),
            ("Supplies", 100.00, "Maximum per purchase"),
            ("Registration", 1000.00, "Maximum per conference"),
        ]
        cursor.executemany("""
            INSERT INTO policies (category, max_amount, description)
            VALUES (?, ?, ?)
        """, sample_policies)


if __name__ == "__main__":
    init_database()
    print(f"Database initialized at {DB_PATH}")