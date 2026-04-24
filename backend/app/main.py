from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.responses import JSONResponse
from pydantic import BaseModel
from app.agent import run_agent
from app.schemas import AgentRequest
from app.history import save_task_history, load_task_history, load_task_by_id
from app.database import init_db
from app.scheduler import start_scheduler
import json
import random
import time
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# OTP store
otp_store = {}

limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait before trying again."}
    )

init_db()
start_scheduler()

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

@app.post("/send-otp")
def send_otp():
    otp = str(random.randint(100000, 999999))
    otp_store["code"] = otp
    otp_store["expires_at"] = time.time() + 300  # 5 minutes

    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    receiver = os.getenv("EMAIL_RECEIVER")

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = sender
        msg["To"] = receiver
        msg["Subject"] = "Your Pulse Verification Code"

        html = f"""
        <div style="font-family: -apple-system, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 28px;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <div style="width: 10px; height: 10px; border-radius: 50%; background: #7c3aed;"></div>
              <span style="font-size: 20px; font-weight: 700; color: #08060d; letter-spacing: -0.02em;">Pulse</span>
            </div>
          </div>

          <h2 style="font-size: 20px; font-weight: 700; color: #08060d; margin: 0 0 8px;">Verification Code</h2>
          <p style="font-size: 14px; color: #6b6375; margin: 0 0 28px;">Use the code below to access your Pulse assistant. Valid for 5 minutes.</p>

          <div style="background: #f4f3f4; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 40px; font-weight: 800; color: #7c3aed; letter-spacing: 0.25em; font-family: monospace;">{otp}</span>
          </div>

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">If you didn't request this, ignore this email.<br/>This code expires in 5 minutes.</p>
        </div>
        """

        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, receiver, msg.as_string())

        print(f"OTP sent to {receiver}")
        return {"message": "OTP sent successfully"}

    except Exception as e:
        print(f"Email OTP error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")


class OTPVerify(BaseModel):
    otp: str

@app.post("/verify-otp")
def verify_otp(body: OTPVerify):
    entered = body.otp.strip()
    stored = otp_store.get("code")
    expires_at = otp_store.get("expires_at", 0)

    if not stored:
        raise HTTPException(status_code=400, detail="No OTP requested. Click Send Code first.")
    if time.time() > expires_at:
        otp_store.clear()
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")
    if entered != stored:
        raise HTTPException(status_code=401, detail="Incorrect code. Try again.")

    otp_store.clear()
    return {"message": "Verified", "token": "pulse_authenticated"}
