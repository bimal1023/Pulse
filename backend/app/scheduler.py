from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.tools import get_news, send_email, get_jobs, send_discord
from app.database import get_connection
from openai import OpenAI
from app.config import OPENAI_API_KEY
from datetime import datetime, timezone
import os
import hashlib

client = OpenAI(api_key=OPENAI_API_KEY)

def send_daily_briefing():
    print("Sending daily AI briefing...")

    raw_news = get_news("artificial intelligence")

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional tech journalist. "
                    "Write a clean, polished daily AI news briefing. "
                    "Format it as follows:\n\n"
                    "- A short intro sentence\n"
                    "- 3 to 5 bullet points, each with a bold headline and 2 sentence summary\n"
                    "- A closing thought or trend observation\n\n"
                    "Keep the tone smart, concise, and engaging."
                )
            },
            {
                "role": "user",
                "content": f"Here is today's raw AI news. Summarize it:\n\n{raw_news}"
            }
        ]
    )

    summary = response.choices[0].message.content

    body = f"""Good morning, Bimal! 👋

Here is your Daily AI Briefing for today:

{summary}

Have a productive day!
---
Sent automatically by Pulse
"""

    send_email(
        subject="Daily AI Briefing",
        body=body
    )
    print("Briefing sent!")


def is_job_seen(job_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM seen_jobs WHERE job_id = ?", (job_id,))
    result = cursor.fetchone()
    conn.close()
    return result is not None

def mark_job_seen(job_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO seen_jobs (job_id, seen_at) VALUES (?, ?)",
        (job_id, datetime.now(timezone.utc).isoformat())
    )
    conn.commit()
    conn.close()

def send_job_matches():
    print("Fetching and scoring jobs...")

    resume = open(os.path.join(os.path.dirname(__file__), "resume.txt")).read()
    raw_jobs = get_jobs("machine learning engineer AI engineer data scientist intern")

    if raw_jobs == "No jobs found.":
        print("No jobs found, skipping.")
        return

    job_id = hashlib.md5(raw_jobs.encode()).hexdigest()

    if is_job_seen(job_id):
        print("No new jobs since last check, skipping.")
        return

    mark_job_seen(job_id)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a career advisor. Given a resume and a list of job postings, "
                    "score each job from 1-10 based on how well it matches the candidate's "
                    "skills, experience, and goals. "
                    "Pick the top 5 matches and format them as:\n\n"
                    "**Job Title — Company**\n"
                    "Score: X/10\n"
                    "Why it matches: (2 sentences)\n"
                    "Link: URL\n\n"
                    "Be honest and specific about why each job fits."
                )
            },
            {
                "role": "user",
                "content": f"Resume:\n{resume}\n\nJob Listings:\n{raw_jobs}"
            }
        ]
    )

    scored = response.choices[0].message.content
    message = f"🎯 **New Job Matches Found!**\n\n{scored}\n\n---\nSent by Pulse"
    send_discord(message)
    print("Job matches sent to Discord!")


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        send_daily_briefing,
        CronTrigger(hour=8, minute=0, timezone="America/New_York")
    )
    scheduler.add_job(
        send_job_matches,
        IntervalTrigger(hours=1)
    )
    scheduler.start()
    print("Scheduler started.")
    return scheduler
