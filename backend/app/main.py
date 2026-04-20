import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.responses import JSONResponse
from app.agent import run_agent
from app.schemas import AgentRequest
from app.history import save_task_history, load_task_history, load_task_by_id
from app.database import init_db
import json

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait before trying again."}
    )

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

@app.get("/")
def root():
    return {"message": "Backend is working now"}

MAX_HISTORY = 20

@app.post("/run-agent")
@limiter.limit("5/minute")
def run(request: Request, body: AgentRequest):
    messages = [m.dict() for m in body.messages][-MAX_HISTORY:]
    task = messages[-1]["content"]

    def generate():
        final_answer = ""
        for chunk in run_agent(messages):
            if chunk["type"] == "token":
                final_answer += chunk["content"]
            elif chunk["type"] == "done":
                save_task_history(task, {
                    "task": task,
                    "final_answer": final_answer,
                    "steps": chunk.get("steps", [])
                })
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/history")
def get_history():
    return load_task_history()

@app.get("/history/{task_id}")
def get_history_by_id(task_id: int):
    task = load_task_by_id(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
