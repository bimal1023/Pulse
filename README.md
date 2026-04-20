# Pulse

An AI-powered research assistant that searches the web, reads the latest news, and looks up Wikipedia — all in a clean, streaming chat interface.

Built with **FastAPI** · **React + Vite** · **OpenAI GPT-4.1 mini** · **Tavily** · **GNews**

---

## Features

- **Multi-tool agent** — automatically decides whether to search the web, fetch news, or query Wikipedia based on your question
- **Streaming responses** — tokens stream in real time as the model thinks
- **Live tool indicators** — shows which tool is running before the answer appears
- **Conversation history** — past sessions are saved to a local SQLite database and accessible from the sidebar
- **Rate limiting** — 5 requests/minute per IP via SlowAPI
- **Input validation** — message roles, lengths, and content are validated server-side via Pydantic

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.10+ |
| AI Model | OpenAI GPT-4.1 mini |
| Web Search | Tavily API |
| News | GNews API |
| Knowledge | Wikipedia REST API |
| Database | SQLite (ephemeral, local) |
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
│   │   └── tools.py        # search_web, get_news, get_wikipedia_summary
│   ├── .env                #  secrets (not committed)
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
cd pulse
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

Optionally create a `.env.local` file if your backend runs elsewhere:

```env
VITE_API_BASE=http://127.0.0.1:8002
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

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

### Backend

Set the following environment variables on your server:

```env
OPENAI_API_KEY=...
TAVILY_API_KEY=...
GNEWS_API_KEY=...
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

Run with a production ASGI server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

### Frontend

Set the backend URL as a build-time env var:

```env
VITE_API_BASE=https://your-backend-domain.com
```

Build and serve:

```bash
npm run build
# deploy the dist/ folder to Vercel, Netlify, or any static host
```

---

## Rate Limiting

The `/run-agent` endpoint is limited to **5 requests per minute** per IP address. Exceeding this returns:

```json
{ "detail": "Too many requests. Please wait before trying again." }
```

---

## License

MIT
