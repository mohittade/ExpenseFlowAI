import os
import sqlite3
import threading
import time

os.environ['DATABASE_PATH'] = 'expenseflow.db'

from src.utils.database import get_connection
from src.tools.database_tool import log_execution


def writer():
    conn = sqlite3.connect('expenseflow.db', timeout=30)
    cur = conn.cursor()
    cur.execute('BEGIN IMMEDIATE')
    time.sleep(2)
    cur.execute(
        'INSERT INTO execution_logs (run_id, agent_name, action, status, details) VALUES (?, ?, ?, ?, ?)',
        ('locktest', 'writer', 'probe', 'started', 'hold lock'),
    )
    conn.commit()
    conn.close()


thread = threading.Thread(target=writer)
thread.start()

for attempt in range(20):
    try:
        log_execution('locktest2', 'reader', 'probe', 'started', 'reading')
        print('LOG_OK')
        break
    except sqlite3.OperationalError as exc:
        if 'locked' in str(exc).lower():
            time.sleep(0.5)
            continue
        raise
else:
    raise RuntimeError('database still locked after retries')

thread.join()
print('DONE')
