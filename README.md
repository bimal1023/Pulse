# Pulse

A personal AI assistant and automation agent that searches the web, reads the latest news, fetches research papers, monitors GitHub trends, and takes real actions like sending emails and Discord messages — all in a clean, streaming chat interface.

Built with **FastAPI** · **React + Vite** · **OpenAI GPT-4.1 mini** · **Tavily** · **GNews** · **APScheduler**

---

## Features

- **Multi-tool agent** — automatically decides which tool to use based on your question
- **Streaming responses** — tokens stream in real time as the model thinks
- **Live tool indicators** — shows which tool is running before the answer appears
- **Conversation history** — past sessions are saved to SQLite and accessible from the sidebar
- **Daily AI briefing** — automatically emails a polished AI news summary every morning
- **Email automation** — agent can send summaries and results to your inbox
- **Discord integration** — agent can post messages to your Discord channel
- **GitHub trending** — fetch trending repositories by language
- **Arxiv research** — fetch latest academic papers on any topic
- **Mobile responsive** — works on phone and desktop
- **Rate limiting** — 5 requests/minute per IP via SlowAPI
- **Input validation** — message roles, lengths, and content validated via Pydantic

---

## Tools

| Tool | Description |
|------|-------------|
| `search_web` | Search the web via Tavily |
| `get_news` | Fetch latest news articles via GNews |
| `get_wikipedia_summary` | Get factual summaries from Wikipedia |
| `get_github_trending` | Get trending GitHub repos by language |
| `get_arxiv_papers` | Fetch latest research papers from Arxiv |
| `send_email` | Send a summary email to the owner |
| `send_discord` | Post a message to the owner's Discord channel |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.10+ |
| AI Model | OpenAI GPT-4.1 mini |
| Web Search | Tavily API |
| News | GNews API |
| Knowledge | Wikipedia REST API |
| GitHub | GitHub REST API |
| Research | Arxiv API |
| Email | Gmail SMTP |
| Discord | Discord Webhooks |
| Scheduler | APScheduler |
| Database | SQLite |
| Frontend | React 19, Vite 8 |
| Rate Limiting | SlowAPI |

---

## Project Structure

```
pulse/
├── backend/
│   ├── app/
│   │   ├── agent.py        # Agentic loop — tool calling + streaming
│   │   ├── config.py       # Env var loading and validation
│   │   ├── database.py     # SQLite connection and schema init
│   │   ├── history.py      # Save and load task history
│   │   ├── main.py         # FastAPI app, routes, CORS, rate limiting
│   │   ├── schemas.py      # Pydantic request/message models
│   │   ├── scheduler.py    # Daily AI briefing scheduler
│   │   └── tools.py        # All 7 agent tools
│   ├── Dockerfile
│   ├── .env                # Secrets (not committed)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx         # Full chat UI — sidebar, streaming, history
    │   ├── App.css
    │   ├── main.jsx
    │   └── index.css
    ├── public/
    ├── index.html
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- API keys for [OpenAI](https://platform.openai.com), [Tavily](https://tavily.com), and [GNews](https://gnews.io)

### 1. Clone the repo

```bash
git clone https://github.com/bimal1023/Pulse.git
cd Pulse
```

### 2. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
GNEWS_API_KEY=...
ALLOWED_ORIGINS=http://localhost:5173

# Email (Gmail SMTP)
EMAIL_SENDER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_RECEIVER=your-gmail@gmail.com

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Start the server:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Optionally create a `.env.local` file:

```env
VITE_API_BASE=http://127.0.0.1:8002
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Daily AI Briefing

Pulse automatically sends a polished AI news summary to your email every morning at 8am ET via APScheduler.

---

## API Reference

### `POST /run-agent`

Runs the agentic loop and streams the response as Server-Sent Events.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "What's happening with AI today?" }
  ]
}
```

**SSE event types:**

| Type | Payload | Description |
|------|---------|-------------|
| `step` | `{ "tool": "get_news" }` | A tool is being called |
| `token` | `{ "content": "..." }` | A streamed answer token |
| `done` | `{ "steps": [...], "final_answer": "..." }` | Run complete |

### `GET /history`

Returns all saved task history ordered newest first.

### `GET /history/{task_id}`

Returns a single task by ID.

---

## Deployment

### Backend (Render)

Set the following environment variables on Render:

```env
OPENAI_API_KEY=...
TAVILY_API_KEY=...
GNEWS_API_KEY=...
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
EMAIL_SENDER=...
EMAIL_PASSWORD=...
EMAIL_RECEIVER=...
DISCORD_WEBHOOK_URL=...
```

Render will auto-detect the `Dockerfile` in `backend/` and deploy automatically.

### Frontend (Vercel)

Set the backend URL as a build-time env var:

```env
VITE_API_BASE=https://your-render-backend.onrender.com
```

Then deploy — Vercel auto-detects Vite and builds correctly.

---

## Rate Limiting

The `/run-agent` endpoint is limited to **5 requests per minute** per IP address. Exceeding this returns:

```json
{ "detail": "Too many requests. Please wait before trying again." }
```

---

## License

MIT
