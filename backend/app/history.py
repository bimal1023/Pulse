import json
from datetime import datetime
from app.database import get_connection

def save_task_history(task:str,result:dict):
    conn=get_connection()
    cursor=conn.cursor()
    cursor.execute(
        """
        INSERT INTO task_history (timestamp,task,result)
        VALUES(?,?,?)
        """,
        (
            datetime.utcnow().isoformat(),
            task,
            json.dumps(result)
        )
    )
    conn.commit()
    conn.close()
def load_task_history():
    conn=get_connection()
    cursor=conn.cursor()
    cursor.execute("""
    SELECT id, timestamp,task,result
    FROM task_history
    ORDER BY id DESC
    """)
    rows=cursor.fetchall()
    conn.close()
    history=[]
    for row in rows:
        history.append({
            "id":row["id"],
            "timestamp":row["timestamp"],
            "task":row["task"],
            "result":json.loads(row["result"])
        })
    return history
def load_task_by_id(task_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, timestamp, task, result
        FROM task_history
        WHERE id = ?
    """, (task_id,))

    row = cursor.fetchone()
    conn.close()

    if row is None:
        return None

    return {
        "id": row["id"],
        "timestamp": row["timestamp"],
        "task": row["task"],
        "result": json.loads(row["result"])
    }