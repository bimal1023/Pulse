import sqlite3
DB_FILE="task_history.db"
def get_connection():
    conn=sqlite3.connect(DB_FILE)
    conn.row_factory=sqlite3.Row
    return conn
def init_db():
    conn=get_connection()
    cursor=conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS task_history(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            task TEXT NOT NULL,
            result TEXT NOT NULL
        )
        """)
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS seen_jobs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT UNIQUE NOT NULL,
            seen_at TEXT NOT NULL
        )
        """)
    conn.commit()
    conn.close()