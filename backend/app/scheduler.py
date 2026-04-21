from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tools import get_news, send_email
from openai import OpenAI
from app.config import OPENAI_API_KEY
import os

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

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        send_daily_briefing,
        CronTrigger(hour=8, minute=0, timezone="America/New_York")
    )
    scheduler.start()
    print("Scheduler started.")
    return scheduler