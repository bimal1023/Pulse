from tavily import TavilyClient
import os
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

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
def send_email(subject:str,body:str)-> str:
    sender=os.getenv("EMAIL_SENDER")
    password=os.getenv("EMAIL_PASSWORD")
    to=os.getenv("EMAIL_RECEIVER")
    msg=MIMEMultipart()
    msg["From"]=sender
    msg["To"]=to
    msg["Subject"]=subject
    msg.attach(MIMEText(body,"plain"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com",465)as server:
            server.login(sender,password)
            server.sendmail(sender,to,msg.as_string())
        return f"Email sent successfully to{to}"
    except Exception as e:
        return f"Failed to send email:{str(e)}"
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
    url = "https://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{topic}",
        "start": 0,
        "max_results": 5,
        "sortBy": "submittedDate",
        "sortOrder": "descending"
    }

    try:
        response = requests.get(url, params=params)
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