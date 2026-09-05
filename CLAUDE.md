# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Pulse

A personal AI assistant and automation agent. Users chat with an OpenAI GPT-4.1-mini powered backend that autonomously calls 11 specialized tools (web search, news, GitHub, Arxiv, job search, email, Discord, YouTube transcripts, PDF generation). A scheduler runs 8 automated daily jobs for briefings, motivation, and new-grad job alerts.

**Stack:** FastAPI (Python) backend · React 19 + Vite frontend · OpenAI GPT-4.1-mini · SQLite · APScheduler · Deployed on Render + Vercel

## Running the Project

**Backend** (port 8002):
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8002
```

**Frontend** (port 5173):
```bash
cd frontend
npm install
npm run dev
```

**Other frontend commands:**
```bash
npm run build    # Production build → dist/
npm run lint     # ESLint
npm run preview  # Preview production build
```

**Required environment variables** (`backend/.env`):
```
OPENAI_API_KEY=
TAVILY_API_KEY=
GNEWS_API_KEY=
EMAIL_SENDER=
EMAIL_PASSWORD=       # Gmail App Password
EMAIL_RECEIVER=
DISCORD_WEBHOOK_URL=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
WEBSHARE_PROXY_USERNAME=   # Optional; only needed in prod for get_youtube_transcript
WEBSHARE_PROXY_PASSWORD=   # YouTube blocks datacenter IPs, so deployed transcript
                           # fetches route through a Webshare RESIDENTIAL proxy.
                           # Leave unset locally (residential IP works directly).
```

**Frontend** (`frontend/.env.local`):
```
VITE_API_BASE=http://127.0.0.1:8002
```

## Architecture

### Agentic Loop (`backend/app/agent.py`)

`run_agent(messages)` is a generator that drives the OpenAI tool-calling loop. It yields three event types consumed by the SSE endpoint:
- `{"type": "step", "tool": "..."}` — tool about to execute
- `{"type": "token", "content": "..."}` — streaming response token
- `{"type": "done", ...}` — final response with metadata

The loop calls tools iteratively until OpenAI returns a final text response with no further tool calls.

### Tools (`backend/app/tools.py`)

11 tools callable by the agent:

| Tool | API |
|------|-----|
| `search_web` | Tavily (3 results max) |
| `get_news` | GNews (5 articles) |
| `get_wikipedia_summary` | Wikipedia REST |
| `get_github_trending` | GitHub REST |
| `get_arxiv_papers` | Arxiv |
| `send_email` | Gmail SMTP |
| `send_discord` | Discord Webhook |
| `get_jobs` | Adzuna |
| `generate_cover_letter` | ReportLab PDF using `backend/app/resume.txt` |
| `get_greenhouse_jobs` | Greenhouse API (capped per company so one board can't fill the results) |
| `get_youtube_transcript` | youtube-transcript-api (via Webshare residential proxy in prod) |

### API Endpoints (`backend/app/main.py`)

- `POST /run-agent` — Streams agent response via SSE; requires `X-Auth-Token` header
- `POST /send-otp` — Emails 6-digit OTP (rate-limited: 5/hour per IP)
- `POST /verify-otp` — Validates OTP, returns `pulse_authenticated` token
- `GET /history` / `GET /history/{id}` — Task history from SQLite
- `GET /test/*` — Dev-only test endpoints for scheduler pipelines

### Scheduler (`backend/app/scheduler.py`)

APScheduler runs 8 daily jobs (times in ET):

| Time | Job |
|------|-----|
| 8:00 AM | Daily AI briefing → email |
| 8:30 AM | Morning motivation → Discord |
| 9:00 AM | Job matching vs resume → Discord |
| 2:30 PM | Job matching vs resume → Discord |
| 8:00 PM | Job matching vs resume → Discord |
| 9:00 PM | Evening motivation → Discord |
| 1:00 AM | AI/ML concept explainer → Discord |
| 1:20 AM | Research summary (Arxiv) → Discord |

**Job alert targeting:** `send_job_matches` is aimed at full-time **new grad** roles for a May 2027
graduation — Software Engineer, AI Engineer, Applied AI, and Agentic AI. `_collect_postings()` fans
out across `JOB_SEARCH_QUERIES` (Adzuna) and `GREENHOUSE_ROLE_QUERIES` (Greenhouse), dedupes by
(title, company), and drops senior/internship titles via `SENIORITY_EXCLUSIONS` before the model
scores anything. The alert fires three times a day per `JOB_ALERT_TIMES`. Retarget the search by
editing those lists at the top of `scheduler.py`;
retarget the *ranking* by editing `backend/app/resume.txt`, whose "Looking For" section is the
profile both the job scorer and `generate_cover_letter` read.

### Frontend (`frontend/src/App.jsx`)

Single-file 1100-line React SPA. Manages:
- OTP lock screen → auth token in `sessionStorage`
- Chat UI with sidebar message history
- SSE streaming: connects to `/run-agent`, parses `step`/`token`/`done` events
- Voice input via Web Speech API
- 6 capability cards as quick-start prompts
- Markdown rendering via `react-markdown` + `remark-gfm`

### Authentication

Email OTP flow: 6-digit code generated server-side, emailed via Gmail SMTP, valid 5 minutes. Verified token (`pulse_authenticated`) stored in `sessionStorage` and sent as `X-Auth-Token` on all protected requests. Token is validated server-side on every protected endpoint.

### Database (`backend/app/database.py`, `backend/app/history.py`)

SQLite (`task_history.db`) stores completed agent runs. No ORM — raw SQL via `sqlite3`. Schema: id, timestamp, user_message, assistant_response, tools_used.

## Deployment

- **Backend**: Render auto-detects `backend/Dockerfile`; container exposes port 8080
- **Frontend**: Vercel auto-detects Vite in `frontend/`
- Rate limiting via SlowAPI: 5 req/min on `/run-agent`, 5/hour on `/send-otp`
