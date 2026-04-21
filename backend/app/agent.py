import json
from openai import OpenAI
from app.config import OPENAI_API_KEY, MODEL_NAME
from app.tools import search_web, get_news, get_wikipedia_summary,send_email,get_github_trending, get_arxiv_papers,send_discord

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM_PROMPT = """You are Pulse, a smart personal AI assistant and automation agent built for Bimal.

## Your Personality
- Smart, concise, and professional
- You get straight to the point — no filler or unnecessary preamble
- You are proactive — if the user asks for news, you also mention trends you notice

## Tool Usage Rules
- Use `get_news` for recent news, current events, and trending topics
- Use `search_web` for general questions, how-tos, and broader research
- Use `get_wikipedia_summary` for factual background on people, places, concepts, or history
- Use `get_github_trending` for trending repositories, developer tools, or open source projects
- Use `get_arxiv_papers` for academic research, scientific papers, and cutting-edge AI research
- Use `send_email` to email a summary or result to Bimal — never ask for an email address
- Use `send_discord` to post a message or summary to Bimal's Discord channel
- Always use the most relevant tool — never guess when a tool can give a better answer
- Chain tools when needed — e.g. fetch news then send via email or Discord

## Response Formatting Rules
- Use clear headings with ## for sections
- Use bullet points for lists and news items
- Use **bold** for important terms, names, and headlines
- Always include source name and URL for news and research items
- For research papers: include title, brief summary, and link
- For GitHub repos: include name, description, stars, and URL
- End responses with a short insight or takeaway when relevant
- Keep responses scannable — avoid long unbroken paragraphs

## Quality Rules
- Only use information from tool results — never fabricate facts
- If a tool returns no results, say so clearly and suggest an alternative
- Always summarize in your own words — do not dump raw tool output
- Be accurate, grounded, and helpful above all else
"""

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_news",
            "description": "Get recent news articles about a topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The topic to search news for"}
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_wikipedia_summary",
            "description": "Get a summary of a topic from Wikipedia.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The topic to look up on Wikipedia"}
                },
                "required": ["topic"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email summary to the owner. Do not ask for or accept an email address.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Email subject"},
                    "body": {"type": "string", "description": "Email body content"}
                },
                "required": ["subject", "body"]
            }
        }
    },
    {
    "type": "function",
    "function": {
        "name": "get_github_trending",
        "description": "Get trending GitHub repositories by programming language.",
        "parameters": {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "description": "Programming language to filter by e.g. python, javascript. Leave empty for all languages."
                },
                "since": {
                    "type": "string",
                    "description": "Time range: daily, weekly, or monthly"
                }
            },
            "required": []
        }
    }
},
{
    "type": "function",
    "function": {
        "name": "get_arxiv_papers",
        "description": "Get the latest research papers from Arxiv on a given topic.",
        "parameters": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "The research topic to search for e.g. machine learning, quantum computing"
                }
            },
            "required": ["topic"]
        }
    }
},
{
    "type": "function",
    "function": {
        "name": "send_discord",
        "description": "Send a message to the owner's Discord channel.",
        "parameters": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "The message to send to Discord"
                }
            },
            "required": ["message"]
        }
    }
}
]


def run_agent(messages: list):
    steps = []

    # Full conversation including system prompt
    conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
    conversation += [{"role": m["role"], "content": m["content"]} for m in messages]

    for _ in range(5):
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=conversation,
            tools=tools,
        )

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls":
            assistant_msg = choice.message

            # Add assistant's tool call message to conversation
            conversation.append({
                "role": "assistant",
                "content": assistant_msg.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments}
                    }
                    for tc in assistant_msg.tool_calls
                ]
            })

            for tool_call in assistant_msg.tool_calls:
                tool_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

                yield {"type": "step", "tool": tool_name}

                if tool_name == "search_web":
                    result = search_web(args["query"])
                elif tool_name == "get_news":
                    result = get_news(args["topic"])
                elif tool_name == "get_wikipedia_summary":
                    result = get_wikipedia_summary(args["topic"])
                elif tool_name == "send_email":
                    result = send_email(args["subject"], args["body"])
                elif tool_name=="get_github_trending":
                    result=get_github_trending(
                        args.get("language",""),
                        args.get("since","daily")
                    )
                elif tool_name=="get_arxiv_papers":
                    result=get_arxiv_papers(args["topic"])
                elif tool_name=="send_discord":
                    result=send_discord(args["message"])
                else:
                    result = f"Unknown tool: {tool_name}"

                steps.append({
                    "step": len(steps) + 1,
                    "tool_name": tool_name,
                    "tool_input": args,
                    "tool_output": result
                })

                # Add tool result to conversation
                conversation.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result
                })

        else:
            # No tool calls — stream the final answer
            final_answer = ""
            stream = client.chat.completions.create(
                model=MODEL_NAME,
                messages=conversation,
                tools=tools,
                stream=True
            )

            for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    final_answer += delta
                    yield {"type": "token", "content": delta}

            yield {"type": "done", "steps": steps, "final_answer": final_answer}
            return

    yield {"type": "done", "steps": steps, "final_answer": "Agent stopped (max steps)"}
