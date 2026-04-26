from tavily import TavilyClient
import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

def search_web(query: str) -> str:
    response = tavily.search(query=query, max_results=3)

    results = []
    for r in response["results"]:
        results.append(
            f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content']}\n"
        )

    return "\n".join(results)

def get_news(topic:str)-> str:
    api_key=os.getenv("GNEWS_API_KEY")
    url="https://gnews.io/api/v4/search"
    params={
        "q":topic,
        "lang":"en",
        "max":5,
        "apikey":api_key
    }

    try:
        response=requests.get(url,params=params)
        response.raise_for_status()
        data=response.json()
        articles=data.get("articles",[])
        if not articles:
            return "No news articles found."
        results=[]
        for article in articles:
            title=article.get("title","")
            description=article.get("description","")
            source=article.get("source",{}).get("name","")
            url=article.get("url","")
            results.append(
                f"Title:{title}\n"
                f"Source:{source}\n"
                f"Description:{description}\n"
                f"URL:{url}\n"
            )
        return "\n".join(results)
    except Exception as e:
        return f"Error fetching news:{str(e)}"

def get_wikipedia_summary(topic:str) -> str:
    url="https://en.wikipedia.org/api/rest_v1/page/summary/" + topic.replace(" ","_")
    headers = {"User-Agent": "ai-automation-agent/1.0 (bimalkumal2004@gmail.com)"}
    try:
        response=requests.get(url, headers=headers)
        response.raise_for_status()
        data=response.json()
        return data.get("extract","No summary found.")
    except Exception as e:
        return f"Error fetching Wikipedia:{str(e)}"
def send_email(subject: str, body: str, to: str = None) -> str:
    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    recipient = to if to else os.getenv("EMAIL_RECEIVER")
    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.sendmail(sender, recipient, msg.as_string())
        return f"Email sent successfully to {recipient}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"
def get_github_trending(language: str = "", since: str = "daily") -> str:
    url = "https://api.github.com/search/repositories"
    params = {
        "q": f"stars:>100{' language:' + language if language else ''}",
        "sort": "stars",
        "order": "desc",
        "per_page": 5
    }
    headers = {"Accept": "application/vnd.github.v3+json"}

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        repos = response.json().get("items", [])

        if not repos:
            return "No trending repositories found."

        results = []
        for repo in repos:
            results.append(
                f"Name: {repo['full_name']}\n"
                f"Description: {repo['description']}\n"
                f"Stars: {repo['stargazers_count']}\n"
                f"URL: {repo['html_url']}\n"
            )
        return "\n".join(results)
    except Exception as e:
        return f"Error fetching GitHub trending: {str(e)}"
def get_arxiv_papers(topic: str) -> str:
    url = "http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{topic}",
        "start": 0,
        "max_results": 5,
        "sortBy": "submittedDate",
        "sortOrder": "descending"
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        
        import xml.etree.ElementTree as ET
        root = ET.fromstring(response.text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        entries = root.findall("atom:entry", ns)

        if not entries:
            return "No papers found."

        results = []
        for entry in entries:
            title = entry.find("atom:title", ns).text.strip()
            summary = entry.find("atom:summary", ns).text.strip()[:300]
            link = entry.find("atom:id", ns).text.strip()
            results.append(
                f"Title: {title}\n"
                f"Summary: {summary}...\n"
                f"Link: {link}\n"
            )
        return "\n".join(results)
    except Exception as e:
        return f"Error fetching papers: {str(e)}"
def send_discord(message: str) -> str:
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")

    import re
    message = re.sub(r'(https?://\S+)', r'<\1>', message)

    try:
        response = requests.post(
            webhook_url,
            json={"content": message},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return "Message sent to Discord successfully!"
    except Exception as e:
        return f"Error sending Discord message: {str(e)}"

def get_jobs(keywords: str = "python developer") -> str:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    url = "https://api.adzuna.com/v1/api/jobs/us/search/1"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": keywords,
        "results_per_page": 5,
        "sort_by": "date"
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        jobs = data.get("results", [])

        if not jobs:
            return "No jobs found."

        results = []
        for job in jobs:
            title = job.get("title", "")
            company = job.get("company", {}).get("display_name", "")
            location = job.get("location", {}).get("display_name", "")
            salary_min = job.get("salary_min", "N/A")
            salary_max = job.get("salary_max", "N/A")
            link = job.get("redirect_url", "")
            description = job.get("description", "")[:200]

            results.append(
                f"Title: {title}\n"
                f"Company: {company}\n"
                f"Location: {location}\n"
                f"Salary: ${salary_min} - ${salary_max}\n"
                f"Description: {description}...\n"
                f"Link: {link}\n"
            )
        return "\n".join(results)
    except Exception as e:
        return f"Error fetching jobs: {str(e)}"

def get_greenhouse_jobs(role: str = "", company: str = "") -> str:
    companies = [
        "anthropic", "stripe", "figma", "notion", "airbnb", "reddit",
        "robinhood", "brex", "scale", "huggingface", "cohere", "mistral",
        "openai", "perplexity", "anyscale", "together", "modal", "replit",
        "vercel", "linear", "retool", "airtable", "asana", "zapier",
        "databricks", "snowflake", "confluent", "dbt", "weights-biases"
    ]

    if company:
        companies = [company.lower().replace(" ", "")]

    results = []
    searched = 0

    for slug in companies:
        try:
            url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
            response = requests.get(url, timeout=5)
            if response.status_code != 200:
                continue
            jobs = response.json().get("jobs", [])
            searched += 1

            for job in jobs:
                title = job.get("title", "")
                if role and role.lower() not in title.lower():
                    continue
                location = job.get("location", {}).get("name", "Not specified")
                link = job.get("absolute_url", "")
                departments = ", ".join([d["name"] for d in job.get("departments", [])])
                results.append(
                    f"Company: {slug.capitalize()}\n"
                    f"Title: {title}\n"
                    f"Department: {departments}\n"
                    f"Location: {location}\n"
                    f"Apply: {link}\n"
                )
                if len(results) >= 10:
                    break
        except Exception:
            continue

        if len(results) >= 10:
            break

    if not results:
        return f"No Greenhouse listings found for '{role}'." if role else "No open roles found."

    header = f"Found {len(results)} role(s) matching '{role}' across Greenhouse companies:\n\n" if role else f"Open roles across top companies:\n\n"
    return header + "\n".join(results)

def generate_cover_letter(job_description: str) -> str:
    resume_path = os.path.join(os.path.dirname(__file__), "resume.txt")
    resume = open(resume_path).read()

    from openai import OpenAI
    from app.config import OPENAI_API_KEY
    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert career coach and professional writer. "
                    "Generate a compelling, personalized cover letter using the resume and job description below.\n\n"
                    "RULES:\n"
                    "- Start with: Dear Hiring Manager,\n"
                    "- Length: 4 paragraphs, max 300 words total\n"
                    "- Tone: Confident, human, warm — NOT robotic or generic\n"
                    "- NEVER use phrases like 'I am writing to express my interest' or 'I believe I am a strong candidate'\n"
                    "- Paragraph 1: Why THIS company specifically + my strongest relevant credential\n"
                    "- Paragraph 2: 2-3 specific skills/experiences from my resume that map directly to the JD — use numbers/outcomes where possible\n"
                    "- Paragraph 3: Leadership, communication, or soft skills with a concrete example\n"
                    "- Paragraph 4: Short closing — thank them, express interest in discussing further\n"
                    "- End with: Thank you for your consideration.\n\n"
                    "FORMATTING: Separate each paragraph with a blank line. Do NOT include 'Sincerely' or the candidate name — those are added separately.\n"
                    "OUTPUT: Just the letter body. No preamble, no explanation."
                )
            },
            {
                "role": "user",
                "content": f"RESUME:\n{resume}\n\n---\n\nJOB DESCRIPTION:\n{job_description}"
            }
        ]
    )

    cover_letter = response.choices[0].message.content

    pdf_path = "/tmp/cover_letter.pdf"
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.styles import ParagraphStyle
    from datetime import date

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=1.25 * inch,
        rightMargin=1.25 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch
    )

    block = ParagraphStyle(
        "Block",
        fontSize=11,
        fontName="Times-Roman",
        leading=15,
        spaceAfter=0,
        alignment=TA_LEFT
    )
    para_style = ParagraphStyle(
        "Para",
        fontSize=11,
        fontName="Times-Roman",
        leading=15,
        spaceBefore=8,
        spaceAfter=0,
        alignment=TA_LEFT
    )

    story = []

    # Sender block (top-left)
    for line in [
        "Bimal Kumal",
        "bimalkumal2004@gmail.com",
        "New York, NY",
        '<a href="https://www.linkedin.com/in/bimal-kumal-aa4101285/" color="blue">LinkedIn</a>',
    ]:
        story.append(Paragraph(line, block))

    story.append(Spacer(1, 10))
    story.append(Paragraph(date.today().strftime("%B %d, %Y"), block))
    story.append(Spacer(1, 6))

    # Body paragraphs from GPT
    for para in cover_letter.split("\n\n"):
        para = para.strip()
        if para:
            story.append(Paragraph(para.replace("\n", " "), para_style))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Sincerely,", block))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Bimal Kumal", block))

    doc.build(story)

    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    to = os.getenv("EMAIL_RECEIVER")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = "Your Cover Letter — Generated by Pulse"
    msg.attach(MIMEText("Hi Bimal,\n\nYour cover letter is attached as a PDF.\n\nGood luck!\n\nPulse", "plain"))

    with open(pdf_path, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment; filename=cover_letter.pdf")
        msg.attach(part)

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, password)
        server.sendmail(sender, to, msg.as_string())

    return "Cover letter generated and sent to your email as a PDF!"