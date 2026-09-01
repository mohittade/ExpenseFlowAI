import importlib
import os
import sqlite3
import tempfile
import unittest


class DatabaseSchemaMigrationTest(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.temp_db.close()
        os.environ["DATABASE_PATH"] = self.temp_db.name
        import src.utils.database as database_module

        self.database_module = importlib.reload(database_module)

    def tearDown(self):
        if os.path.exists(self.temp_db.name):
            os.remove(self.temp_db.name)

    def test_init_database_adds_missing_run_id_column(self):
        conn = sqlite3.connect(self.temp_db.name)
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
        conn.close()

        self.database_module.init_database()

        conn = sqlite3.connect(self.temp_db.name)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(execution_logs)")
        columns = [row[1] for row in cursor.fetchall()]
        conn.close()

        self.assertIn("run_id", columns)

        from src.tools.database_tool import log_execution

        log_execution("test-run-123", "supervisor", "plan", "started", "test details")

    def test_parse_request_uses_user_request_date_range_when_plan_has_none(self):
        from src.graph import workflow

        original_plan = workflow.supervisor.plan
        workflow.supervisor.plan = lambda user_request, run_id: {"plan": [{"step": 1, "agent": "test", "action": "run", "description": "test"}]}

        try:
            state = {
                "run_id": "test-run",
                "user_request": "Generate my travel expense report for July 2025 and email it to finance.",
                "employee_id": 1,
                "employee_name": "John Doe",
                "date_range": {},
                "plan": [],
            }
            workflow.parse_request(state)
            self.assertEqual(state["date_range"], "July 2025")
        finally:
            workflow.supervisor.plan = original_plan


if __name__ == "__main__":
    unittest.main()
