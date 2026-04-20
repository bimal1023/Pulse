from tavily import TavilyClient
import os
import requests

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
