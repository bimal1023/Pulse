import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8002";

function linkifyText(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (!/^https?:\/\//.test(part)) return part;
    const clean = part.replace(/[).,!?]+$/, "");
    const trailing = part.slice(clean.length);
    return (
      <span key={index}>
        <a href={clean} target="_blank" rel="noreferrer"
          style={{ color: "var(--accent)", textDecoration: "underline" }}>
          {clean}
        </a>
        {trailing}
      </span>
    );
  });
}

function FormattedText({ text }) {
  if (!text) return null;
  return (
    <div style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
      {text.split("\n").map((line, i) => (
        <div key={i}>{linkifyText(line)}</div>
      ))}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [activeTool, setActiveTool] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      setHistory(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError("");
    setStreamingContent("");
    setActiveTool("");
    setSidebarOpen(false);

    try {
      const res = await fetch(`${API_BASE}/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) throw new Error("Failed to run agent");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = JSON.parse(line.slice(6));

          if (chunk.type === "step") {
            setActiveTool(chunk.tool);
          } else if (chunk.type === "token") {
            setActiveTool("");
            fullAnswer += chunk.content;
            setStreamingContent(fullAnswer);
          } else if (chunk.type === "done") {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: fullAnswer }
            ]);
            setStreamingContent("");
            setLoading(false);
            fetchHistory();
          }
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const loadHistoryItem = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`);
      const data = await res.json();
      const item = data.result ?? data;
      setMessages([
        { role: "user", content: item.task },
        { role: "assistant", content: item.final_answer },
      ]);
      setStreamingContent("");
      setSidebarOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setStreamingContent("");
    setActiveTool("");
    setError("");
    setInput("");
    setSidebarOpen(false);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.start();
    setListening(true);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const toolLabels = {
    search_web: "Searching the web...",
    get_news: "Reading news...",
    get_wikipedia_summary: "Looking up Wikipedia...",
  };

  return (
    <div className="app-shell">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <button onClick={startNewChat} className="new-chat-btn">+ New Chat</button>

        <div className="history-label">History</div>

        {history.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>No history yet.</p>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => loadHistoryItem(item.id)}
            className="history-item"
          >
            <div className="history-item-title">{item.task}</div>
            <div className="history-item-date">
              {new Date(item.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Main chat area */}
      <div className="chat-area">

        {/* Header */}
        <div className="header">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-logo">
            <span className="header-dot" />
            Pulse
          </div>
        </div>

        {/* Messages */}
        <div className="messages">

          {messages.length === 0 && !loading && (
            <div className="welcome">
              <div className="welcome-icon">
                <span className="welcome-dot" />
              </div>
              <h2 className="welcome-title">Good {getGreeting()}, Bimal.</h2>
              <p className="welcome-sub">Your personal AI assistant. What can I help you with today?</p>

              <div className="capability-grid">
                {[
                  { icon: "🌐", label: "Web Search", prompt: "Search the web for the latest AI trends" },
                  { icon: "📰", label: "News Briefing", prompt: "What's happening in AI and tech today?" },
                  { icon: "💼", label: "Job Matches", prompt: "Find the latest AI and ML engineering internships" },
                  { icon: "📄", label: "Cover Letter", prompt: "Generate a cover letter for this job:" },
                  { icon: "🔬", label: "Research Papers", prompt: "Find the latest Arxiv papers on large language models" },
                  { icon: "💻", label: "GitHub Trending", prompt: "Show me trending Python repositories on GitHub" },
                ].map(({ icon, label, prompt }) => (
                  <button key={label} className="capability-card" onClick={() => setInput(prompt)}>
                    <span className="capability-icon">{icon}</span>
                    <span className="capability-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message-row ${msg.role}`}>
              <div className={`bubble ${msg.role}`}>
                <FormattedText text={msg.content} />
              </div>
            </div>
          ))}

          {(streamingContent || activeTool) && (
            <div className="message-row assistant">
              <div className="bubble assistant">
                {activeTool && !streamingContent && (
                  <span style={{ color: "var(--accent)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="pulse-dot" />
                    {toolLabels[activeTool] ?? "Working..."}
                  </span>
                )}
                {streamingContent && <FormattedText text={streamingContent} />}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">{error}</div>
        )}

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={listening ? "Listening..." : messages.length > 0 ? "Ask a follow-up..." : "Ask anything..."}
              className="chat-input"
            />
            <button
              onClick={toggleVoice}
              className={`mic-btn ${listening ? "mic-active" : ""}`}
              title={listening ? "Stop listening" : "Voice input"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor"/>
                <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className={`send-btn ${loading ? "loading" : ""}`}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .app-shell {
          display: flex;
          height: 100svh;
          overflow: hidden;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 14px;
          gap: 6px;
          overflow-y: auto;
          background: var(--bg);
        }

        .sidebar-overlay { display: none; }

        .new-chat-btn {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: transparent;
          color: var(--text-h);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          transition: background 0.15s;
          margin-bottom: 6px;
        }
        .new-chat-btn:hover { background: var(--accent-bg); }

        .history-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
          padding: 8px 4px 4px;
        }

        .history-item {
          padding: 9px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-h);
          line-height: 1.4;
          transition: background 0.15s;
        }
        .history-item:hover { background: var(--accent-bg); }

        .history-item-title {
          font-weight: 500;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .history-item-date { font-size: 11px; color: var(--text); }

        /* ── Chat area ── */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .header {
          padding: 14px 24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 600;
          color: var(--text-h);
          letter-spacing: -0.01em;
        }

        .header-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
          box-shadow: 0 0 6px var(--accent);
        }

        .menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text-h);
          padding: 4px;
          line-height: 1;
        }

        /* ── Messages ── */
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* ── Welcome screen ── */
        .welcome {
          margin: auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          max-width: 600px;
          width: 100%;
        }

        .welcome-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--accent-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .welcome-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
          animation: pulse 2s infinite;
        }

        .welcome-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-h);
          letter-spacing: -0.02em;
        }

        .welcome-sub {
          font-size: 15px;
          color: var(--text);
          margin-bottom: 8px;
        }

        .capability-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 100%;
          margin-top: 8px;
        }

        .capability-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.2s, background 0.2s, transform 0.15s;
        }
        .capability-card:hover {
          border-color: var(--accent);
          background: var(--accent-bg);
          transform: translateY(-1px);
        }

        .capability-icon { font-size: 20px; }

        .capability-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-h);
        }

        /* ── Bubbles ── */
        .message-row { display: flex; }
        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .bubble {
          max-width: 72%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 15px;
          line-height: 1.6;
        }

        .bubble.user {
          background: var(--accent);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .bubble.assistant {
          background: var(--code-bg);
          color: var(--text-h);
          border-bottom-left-radius: 4px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
          animation: pulse 1s infinite;
        }

        /* ── Input ── */
        .error-banner {
          margin: 0 24px 12px;
          padding: 12px 14px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 10px;
          font-size: 14px;
        }

        .input-area {
          padding: 16px 24px 20px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 6px 6px 6px 16px;
          transition: border-color 0.2s;
        }
        .input-row:focus-within { border-color: var(--accent); }

        .chat-input {
          flex: 1;
          padding: 8px 0;
          border: none;
          background: transparent;
          font-size: 15px;
          color: var(--text-h);
          outline: none;
          min-width: 0;
        }
        .chat-input::placeholder { color: var(--text); }

        .mic-btn {
          padding: 9px 10px;
          border: none;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s;
          color: var(--text);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mic-btn:hover { background: var(--accent-bg); color: var(--accent); }
        .mic-btn.mic-active { color: #ef4444; animation: pulse 1s infinite; }

        .send-btn {
          padding: 9px 18px;
          border: none;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          transition: opacity 0.2s;
          flex-shrink: 0;
        }
        .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .send-btn.loading { opacity: 0.45; cursor: not-allowed; }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* ── Mobile ── */
        @media (max-width: 640px) {
          .sidebar {
            position: fixed;
            top: 0; left: 0;
            height: 100%;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: 80%;
            max-width: 300px;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          }
          .sidebar.sidebar-open { transform: translateX(0); }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 99;
          }
          .menu-btn { display: block; }
          .header { padding: 12px 16px; }
          .messages { padding: 16px; gap: 14px; }
          .bubble { max-width: 88%; font-size: 14px; }
          .input-area { padding: 12px 16px 16px; }
          .error-banner { margin: 0 16px 10px; }
          .capability-grid { grid-template-columns: repeat(2, 1fr); }
          .welcome-title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}

export default App;
