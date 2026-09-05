from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.tools import get_news, send_email, get_jobs, send_discord, get_arxiv_papers, get_greenhouse_jobs
from openai import OpenAI
from app.config import OPENAI_API_KEY
import os
import random
import re

client = OpenAI(api_key=OPENAI_API_KEY)


def send_daily_briefing():
    print("Sending daily AI briefing...")
    try:
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
        send_email(subject="Daily AI Briefing", body=body)
        print("Briefing sent!")

    except Exception as e:
        print(f"ERROR in send_daily_briefing: {e}")



# Full-time new grad targeting: Bimal graduates May 2027, so the alert hunts
# entry-level SWE / AI engineering roles and deliberately ignores internships.
JOB_SEARCH_QUERIES = [
    "new grad software engineer",
    "entry level software engineer",
    "associate software engineer",
    "AI engineer",
    "applied AI engineer",
    "machine learning engineer",
]

# When the job alert fires each day (24h, America/New_York). Spread across
# waking hours so a morning-posted role isn't sitting unseen until midnight.
JOB_ALERT_TIMES = [(9, 0), (14, 30), (20, 0)]

# Titles worth surfacing from company Greenhouse boards.
GREENHOUSE_ROLE_QUERIES = [
    "software engineer",
    "AI engineer",
    "machine learning engineer",
]

# Anything matching these in a title is too senior for a new grad, or is an
# internship — dropped before the model ever scores it. Matched on word
# boundaries so level suffixes like "II" don't fire on words such as "driver".
SENIORITY_EXCLUSIONS = (
    "senior", "sr", "staff", "principal", "lead", "manager", "director",
    "head of", "vp", "architect", "intern", "interns", "internship",
    "co-op", "coop", "ii", "iii", "iv", "2", "3",
)

_EXCLUSION_RE = re.compile(
    r"(?<![a-z0-9])(?:" + "|".join(re.escape(t) for t in SENIORITY_EXCLUSIONS) + r")(?![a-z0-9])"
)


def _is_entry_level(title: str) -> bool:
    return not _EXCLUSION_RE.search(title.lower())


def _collect_postings():
    """Fan out across Adzuna queries plus Greenhouse boards, dedupe, drop senior roles."""
    blocks = []
    seen = set()

    def absorb(raw: str):
        if not raw or raw.startswith("Error") or raw.startswith("No jobs found"):
            return
        for block in raw.split("\n\n"):
            block = block.strip()
            if not block:
                continue
            title = ""
            company = ""
            for line in block.split("\n"):
                if line.startswith("Title:"):
                    title = line[len("Title:"):].strip()
                elif line.startswith("Company:"):
                    company = line[len("Company:"):].strip()
            if not title or not _is_entry_level(title):
                continue
            key = (title.lower(), company.lower())
            if key in seen:
                continue
            seen.add(key)
            blocks.append(block)

    for query in JOB_SEARCH_QUERIES:
        try:
            absorb(get_jobs(query))
        except Exception as e:
            print(f"Adzuna query failed for '{query}': {e}")

    for role in GREENHOUSE_ROLE_QUERIES:
        try:
            raw = get_greenhouse_jobs(role=role, limit=15)
            # get_greenhouse_jobs prefixes a human-readable header line, and
            # labels its URL "Apply:" where Adzuna uses "Link:".
            if "\n\n" in raw:
                raw = raw.split("\n\n", 1)[1]
            absorb(raw.replace("Apply: ", "Link: "))
        except Exception as e:
            print(f"Greenhouse query failed for '{role}': {e}")

    return blocks


def send_job_matches(force: bool = False):
    print("Fetching and scoring jobs...")
    try:
        resume = open(os.path.join(os.path.dirname(__file__), "resume.txt")).read()
        postings = _collect_postings()

        if not postings:
            print("No entry-level postings returned from Adzuna or Greenhouse.")
            return "no_jobs"

        print(f"Found {len(postings)} entry-level posting(s), sending to the model for scoring...")
        raw_jobs = "\n\n".join(postings)

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a career advisor for Bimal, a software engineer graduating in "
                        "May 2027 and searching for FULL-TIME NEW GRAD roles starting mid-2027. "
                        "He is open to Software Engineer, AI Engineer, Applied AI, and Agentic AI "
                        "positions.\n\n"
                        "HARD FILTERS — silently discard any posting that is:\n"
                        "- an internship, co-op, apprenticeship, or contract/part-time role\n"
                        "- senior, staff, principal, lead, manager, or director level\n"
                        "- requiring 3+ years of professional experience\n"
                        "- not a software engineering, AI/ML, or data engineering role\n\n"
                        "Score every surviving job from 1-10 on fit against his resume — weight "
                        "backend/full-stack Python and TypeScript work, LLM and agent systems, RAG "
                        "and retrieval/ranking, evaluation harnesses, and cloud infrastructure most "
                        "heavily. New York City and remote roles get a small boost.\n\n"
                        "IMPORTANT: a posting explicitly labelled new grad, university grad, campus, "
                        "entry level, or class of 2027 is one he can realistically be hired into, so "
                        "rank it above an unlabelled role of otherwise equal fit.\n\n"
                        "Return the top 5 matches, best first, formatted as:\n\n"
                        "**Job Title — Company**\n"
                        "Score: X/10\n"
                        "Why it matches: (2 sentences, specific to his resume)\n"
                        "Link: URL\n\n"
                        "Be honest and specific. If fewer than 5 postings survive the filters, "
                        "return only the ones that do. If none survive, say so in one line."
                    )
                },
                {
                    "role": "user",
                    "content": f"Resume:\n{resume}\n\nJob Listings:\n{raw_jobs}"
                }
            ]
        )

        scored = response.choices[0].message.content
        message = (
            f"🎯 **New Grad Job Matches — SWE / AI Engineering**\n\n{scored}\n\n"
            f"---\nScreened {len(postings)} entry-level postings · Sent by Pulse"
        )
        send_discord(message)
        print("Job matches sent to Discord!")
        return "sent"

    except Exception as e:
        print(f"ERROR in send_job_matches: {e}")
        return f"error: {e}"


def send_motivation_quote(time_of_day: str = "morning"):
    print(f"Sending {time_of_day} motivation quote...")
    try:
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

    except Exception as e:
        print(f"ERROR in send_motivation_quote ({time_of_day}): {e}")


def send_nightly_research():
    print("Sending nightly research summary...")
    try:
        topics = ["large language models", "AI agents", "machine learning", "deep learning"]
        topic = random.choice(topics)

        raw_papers = get_arxiv_papers(topic)

        if raw_papers.startswith("No papers found") or raw_papers.startswith("Error fetching papers"):
            print(f"Arxiv fetch failed or no papers: {raw_papers}")
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

    except Exception as e:
        print(f"ERROR in send_nightly_research: {e}")


def send_daily_concept():
    print("Sending daily AI/ML concept...")
    try:
        topics = [
            "machine learning", "deep learning", "natural language processing",
            "computer vision", "reinforcement learning", "AI agents",
            "transformer architecture", "prompt engineering", "MLOps",
            "automation engineering", "data pipelines", "model fine-tuning",
            "vector databases", "retrieval augmented generation", "AI safety"
        ]

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

    except Exception as e:
        print(f"ERROR in send_daily_concept: {e}")


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        send_daily_briefing,
        CronTrigger(hour=8, minute=0, timezone="America/New_York")
    )
    for hour, minute in JOB_ALERT_TIMES:
        scheduler.add_job(
            send_job_matches,
            CronTrigger(hour=hour, minute=minute, timezone="America/New_York")
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
        CronTrigger(hour=1, minute=20, timezone="America/New_York")
    )
    scheduler.add_job(
        send_daily_concept,
        CronTrigger(hour=1, minute=0, timezone="America/New_York")
    )
    scheduler.start()
    print("Scheduler started.")
    return scheduler
