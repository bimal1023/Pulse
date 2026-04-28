import json
from openai import OpenAI
from app.config import OPENAI_API_KEY, MODEL_NAME
from app.tools import search_web, get_news, get_wikipedia_summary, send_email, get_github_trending, get_arxiv_papers, send_discord, get_jobs, generate_cover_letter, get_greenhouse_jobs

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
- Use `send_email` to send emails from Bimal's Gmail — if he says "send this to john@example.com", pass that address in the `to` field; otherwise it goes to Bimal's own email by default
- Use `send_discord` to post a message or summary to Bimal's Discord channel
- Use `get_jobs` for finding AI, ML, automation engineering jobs and internships
- Use `generate_cover_letter` when Bimal provides a job description and wants a cover letter PDF sent to his email
- Use `get_greenhouse_jobs` when Bimal asks about open roles at a specific company (e.g. "jobs at Anthropic", "what is Stripe hiring for")
- Always use the most relevant tool — never guess when a tool can give a better answer
- Chain tools when needed — e.g. fetch news then send via email or Discord


## Response Formatting Rules
- Use clear headings with ## for sections
- Format lists of items (news, papers, jobs, repos) so that each item is numbered, and its specific details are bulleted underneath.
  Example:
  1. **Item Title**
     - **Source/Company:** Name
     - **Summary:** Description text
     - **Link:** [URL]
- Use **bold** for important terms, names, and headlines
- Always include source name and URL for news and research items
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
            "description": "Send an email from Bimal's Gmail. If the user says 'send email to someone@example.com', use that address. Otherwise send to Bimal's own email by default.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Email subject line"},
                    "body": {"type": "string", "description": "Email body content"},
                    "to": {"type": "string", "description": "Recipient email address. Only include if the user explicitly specifies someone to send to. Leave out to send to Bimal's own email."}
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
},
{
    "type": "function",
    "function": {
        "name": "get_jobs",
        "description": "Search for latest AI, ML and automation job listings and internships.",
        "parameters": {
            "type": "object",
            "properties": {
                "keywords": {
                    "type": "string",
                    "description": "Search for latest AI, ML, automation engineering jobs and internships. Searches for roles like ML engineer, AI engineer, AI automation engineer, and related internships."
                }
            },
            "required": ["keywords"]
        }
    }
},
{
    "type": "function",
    "function": {
        "name": "generate_cover_letter",
        "description": "Generate a personalized cover letter as a PDF and send it to Bimal's email based on a job description.",
        "parameters": {
            "type": "object",
            "properties": {
                "job_description": {
                    "type": "string",
                    "description": "The full job description to generate a cover letter for"
                }
            },
            "required": ["job_description"]
        }
    }
},
{
    "type": "function",
    "function": {
        "name": "get_greenhouse_jobs",
        "description": "Search open job listings by role across top tech companies on Greenhouse, or filter by a specific company.",
        "parameters": {
            "type": "object",
            "properties": {
                "role": {
                    "type": "string",
                    "description": "Job role or keyword to search for e.g. 'machine learning engineer', 'data scientist', 'intern'"
                },
                "company": {
                    "type": "string",
                    "description": "Optional specific company slug e.g. anthropic, stripe, figma. Leave empty to search all companies."
                }
            },
            "required": []
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
                    result = send_email(args["subject"], args["body"], args.get("to"))
                elif tool_name=="get_github_trending":
                    result=get_github_trending(
                        args.get("language",""),
                        args.get("since","daily")
                    )
                elif tool_name=="get_arxiv_papers":
                    result=get_arxiv_papers(args["topic"])
                elif tool_name=="send_discord":
                    result=send_discord(args["message"])
                elif tool_name == "get_jobs":
                    result = get_jobs(args.get("keywords", "AI ML engineer intern automation"))
                elif tool_name=="generate_cover_letter":
                    result=generate_cover_letter(args["job_description"])
                elif tool_name=="get_greenhouse_jobs":
                    result=get_greenhouse_jobs(
                        role=args.get("role", ""),
                        company=args.get("company", "")
                    )
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
