from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.tools import get_news, send_email, get_jobs, send_discord, get_arxiv_papers
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


def send_motivation_quote(time_of_day: str = "morning"):
    print(f"Sending {time_of_day} motivation quote...")

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a personal motivational coach for Bimal, a hardworking CS student "
                    "at St. Joseph's University New York who is building AI projects, learning every day, "
                    "and working toward a career in AI/ML engineering.\n\n"
                    f"Generate one powerful, genuine motivational message for his {time_of_day}.\n\n"
                    "RULES:\n"
                    "- Start with a short punchy quote (original or from a known figure, with attribution)\n"
                    "- Follow with 2-3 sentences of personal encouragement specific to a student building AI projects and grinding toward their goals\n"
                    "- Keep the tone warm, real, and energizing — not generic or preachy\n"
                    "- End with one short action-oriented line for the day\n"
                    "- Total length: under 100 words\n"
                    "OUTPUT: Just the message. No preamble."
                )
            },
            {
                "role": "user",
                "content": f"Send me my {time_of_day} motivation."
            }
        ]
    )

    quote = response.choices[0].message.content
    emoji = "🌅" if time_of_day == "morning" else "🌙"
    message = f"{emoji} **{time_of_day.capitalize()} Motivation for Bimal**\n\n{quote}\n\n— Pulse"
    send_discord(message)
    print(f"Motivation quote sent ({time_of_day})!")


def send_nightly_research():
    print("Sending nightly research summary...")

    topics = ["large language models", "AI agents", "machine learning", "deep learning"]
    import random
    topic = random.choice(topics)

    raw_papers = get_arxiv_papers(topic)

    if "No papers found" in raw_papers or "Error" in raw_papers:
        print("No papers found, skipping.")
        return

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a research assistant summarizing the latest AI papers for Bimal, "
                    "a CS student interested in AI/ML engineering.\n\n"
                    "Given a list of recent Arxiv papers, pick the single most interesting one "
                    "and write a summary in this format:\n\n"
                    "**Paper:** [title]\n"
                    "**Why it matters:** 2 sentences explaining the significance\n"
                    "**Key idea:** 2 sentences on what the paper actually does\n"
                    "**Takeaway:** One sentence on what to learn from this\n\n"
                    "Keep it sharp, clear, and under 120 words. No jargon overload."
                )
            },
            {
                "role": "user",
                "content": f"Here are today's papers on {topic}:\n\n{raw_papers}"
            }
        ]
    )

    summary = response.choices[0].message.content
    message = f"📚 **Tonight's Research Pick — {topic.title()}**\n\n{summary}\n\n— Pulse"
    send_discord(message)
    print("Nightly research summary sent!")


def send_daily_concept():
    print("Sending daily AI/ML concept...")

    topics = [
        "machine learning", "deep learning", "natural language processing",
        "computer vision", "reinforcement learning", "AI agents",
        "transformer architecture", "prompt engineering", "MLOps",
        "automation engineering", "data pipelines", "model fine-tuning",
        "vector databases", "retrieval augmented generation", "AI safety"
    ]

    import random
    topic = random.choice(topics)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a technical mentor teaching Bimal, a CS student preparing for "
                    "AI/ML engineering interviews and internships.\n\n"
                    "Explain one core concept from the given topic in this exact format:\n\n"
                    "**Concept:** [name of the concept]\n\n"
                    "**What it is:** 2 sentences, plain English, no jargon\n\n"
                    "**How it works:** 3-4 sentences explaining the mechanics simply\n\n"
                    "**Real world example:** 1-2 sentences of a concrete use case\n\n"
                    "**Interview tip:** One sentence on how this commonly appears in interviews\n\n"
                    "Keep the total under 150 words. Be clear and practical."
                )
            },
            {
                "role": "user",
                "content": f"Teach me an important concept from: {topic}"
            }
        ]
    )

    concept = response.choices[0].message.content
    message = f"🧠 **Tonight's AI/ML Concept**\n\n{concept}\n\n---\nStudy well, Bimal! — Pulse"
    send_discord(message)
    print("Daily concept sent!")


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
    scheduler.add_job(
        send_motivation_quote,
        CronTrigger(hour=8, minute=30, timezone="America/New_York"),
        kwargs={"time_of_day": "morning"}
    )
    scheduler.add_job(
        send_motivation_quote,
        CronTrigger(hour=21, minute=0, timezone="America/New_York"),
        kwargs={"time_of_day": "evening"}
    )
    scheduler.add_job(
        send_nightly_research,
        CronTrigger(hour=21, minute=30, timezone="America/New_York")
    )
    scheduler.add_job(
        send_daily_concept,
        CronTrigger(hour=1, minute=0, timezone="America/New_York")
    )
    scheduler.start()
    print("Scheduler started.")
    return scheduler
