# Pulse

A personal AI assistant and automation agent built for real-world use — searches the web, reads the news, finds jobs, generates cover letters, monitors GitHub trends, fetches research papers, and delivers automated daily briefings via email and Discord.

**Live:** [pulse-frontend.vercel.app](https://pulse-frontend.vercel.app) · **Backend:** Render · **Frontend:** Vercel

Built with **FastAPI** · **React + Vite** · **OpenAI GPT-4.1 mini** · **APScheduler** · **SQLite** · **Gmail SMTP** · **Discord Webhooks**

---

## Features

- **Autonomous tool-calling agent** — decides which tool to use, chains multiple tools together, and streams the final answer in real time
- **Real-time token streaming** — SSE-based streaming replicates ChatGPT-style response delivery
- **Voice input** — speak your query via Web Speech API, text fills automatically
- **Markdown rendering** — responses render with proper headings, lists, bold, tables, and code blocks
- **Conversation history** — all sessions saved to SQLite and accessible from the sidebar
- **Email OTP authentication** — 6-digit code sent to owner's email, 5-minute expiry, restricts access to authorized user only
- **Daily AI briefing** — polished AI news summary emailed every morning at 8am ET
- **Motivation quotes** — personalized motivational messages sent to Discord at 8:30am and 9pm ET
- **Nightly research summary** — one highlighted Arxiv paper summarized and sent to Discord at 9:30pm ET
- **AI/ML concept of the night** — one technical concept explained and sent to Discord at 1am ET
- **Hourly job matching** — AI/ML jobs fetched, GPT-scored against resume, sent to Discord — with deduplication
- **Cover letter generator** — paste a job description, get a formatted PDF cover letter emailed as attachment
- **Greenhouse job search** — search open roles by title across 30+ top tech companies
- **Mobile responsive** — hamburger sidebar, 2-column card grid, optimized for all screen sizes
- **Rate limiting** — 5 requests/minute per IP via SlowAPI
- **Input validation** — roles, lengths, and content validated via Pydantic

---

## Tools

| Tool | Description |
|------|-------------|
| `search_web` | Search the web via Tavily API |
| `get_news` | Fetch latest news articles via GNews API |
| `get_wikipedia_summary` | Get factual summaries from Wikipedia |
| `get_github_trending` | Get trending GitHub repos by language |
| `get_arxiv_papers` | Fetch latest research papers from Arxiv |
| `send_email` | Send a summary email to the owner |
| `send_discord` | Post a message to the owner's Discord channel |
| `get_jobs` | Search AI/ML job listings via Adzuna API |
| `generate_cover_letter` | Generate a PDF cover letter and email it |
| `get_greenhouse_jobs` | Search open roles across top tech companies on Greenhouse |

---

## Automated Pipelines

| Time | What Happens |
|------|-------------|
| **8:00 AM ET** | AI news briefing → email |
| **8:30 AM ET** | Morning motivation quote → Discord |
| **Every hour** | Job matching (Adzuna, GPT-scored) → Discord |
| **9:00 PM ET** | Evening motivation quote → Discord |
| **9:30 PM ET** | Nightly research paper summary → Discord |
| **1:00 AM ET** | AI/ML concept of the night → Discord |

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
| Job Search | Adzuna API + Greenhouse API |
| PDF Generation | ReportLab |
| Email | Gmail SMTP |
| Discord | Discord Webhooks |
| Authentication | Email OTP (Gmail SMTP) |
| Scheduler | APScheduler |
| Database | SQLite |
| Frontend | React 19, Vite, react-markdown |
| Rate Limiting | SlowAPI |
| Deployment | Render (backend) + Vercel (frontend) |

---

## Project Structure

```
pulse/
├── backend/
│   ├── app/
│   │   ├── agent.py        # Agentic loop — tool calling + streaming
│   │   ├── config.py       # Env var loading
│   │   ├── database.py     # SQLite connection and schema
│   │   ├── history.py      # Save and load task history
│   │   ├── main.py         # FastAPI app, OTP endpoints, routes
│   │   ├── schemas.py      # Pydantic request/message models
│   │   ├── scheduler.py    # All 6 automated scheduled pipelines
│   │   ├── tools.py        # All 10 agent tools
│   │   └── resume.txt      # Resume used for job matching and cover letters
│   ├── Dockerfile
│   ├── .env                # Secrets (not committed)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx         # Full chat UI — streaming, voice, history, OTP lock
    │   ├── main.jsx
    │   └── index.css       # CSS variables, dark mode, lock screen styles
    ├── public/
    ├── index.html
    └── package.json
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- API keys for OpenAI, Tavily, GNews, and Adzuna

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

# Email (Gmail SMTP — use App Password)
EMAIL_SENDER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_RECEIVER=your-email@gmail.com

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Adzuna Job Search
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
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

Create a `.env.local` file:

```env
VITE_API_BASE=http://127.0.0.1:8002
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Authentication

Pulse uses **email OTP authentication** to restrict access to the owner only.

1. Open the app → lock screen appears
2. Click **Send Verification Code** → 6-digit code sent to owner's email
3. Enter the code → access granted for the session
4. Session expires when the browser tab is closed

---

## API Reference

### `POST /run-agent`
Runs the agentic loop and streams the response as Server-Sent Events.

```json
{ "messages": [{ "role": "user", "content": "What's happening in AI today?" }] }
```

| Event | Payload | Description |
|-------|---------|-------------|
| `step` | `{ "tool": "get_news" }` | Tool is being called |
| `token` | `{ "content": "..." }` | Streamed answer token |
| `done` | `{ "steps": [...], "final_answer": "..." }` | Run complete |

### `POST /send-otp`
Generates a 6-digit OTP and sends it to the owner's email.

### `POST /verify-otp`
Verifies the submitted OTP. Returns `{ "token": "pulse_authenticated" }` on success.

### `GET /history`
Returns all saved task history ordered newest first.

### `GET /history/{task_id}`
Returns a single task by ID.

---

## Deployment

### Backend (Render)

```env
OPENAI_API_KEY=...
TAVILY_API_KEY=...
GNEWS_API_KEY=...
EMAIL_SENDER=...
EMAIL_PASSWORD=...
EMAIL_RECEIVER=...
DISCORD_WEBHOOK_URL=...
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
```

Render auto-detects the `Dockerfile` in `backend/` and deploys automatically.

### Frontend (Vercel)

```env
VITE_API_BASE=https://your-render-backend.onrender.com
```

Vercel auto-detects Vite and builds correctly.

---

## Rate Limiting

The `/run-agent` endpoint is limited to **5 requests per minute** per IP:

```json
{ "detail": "Too many requests. Please wait before trying again." }
```

---

## License

MIT
