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
  const bottomRef = useRef(null);

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
          <h1 style={{ margin: 0, fontSize: "20px" }}>Pulse</h1>
        </div>

        {/* Messages */}
        <div className="messages">

          {messages.length === 0 && !loading && (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text)" }}>
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>Ask me anything.</p>
              <p style={{ fontSize: "13px" }}>I can search the web, read news, and look up Wikipedia.</p>
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
              placeholder={messages.length > 0 ? "Ask a follow-up..." : "Ask anything..."}
              className="chat-input"
            />
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
        * { box-sizing: border-box; }

        .app-shell {
          display: flex;
          height: 100svh;
          overflow: hidden;
          position: relative;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 16px;
          gap: 12px;
          overflow-y: auto;
          background: var(--bg);
        }

        .sidebar-overlay {
          display: none;
        }

        .new-chat-btn {
          padding: 10px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: transparent;
          color: var(--text-h);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          text-align: left;
        }

        .history-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
          margin-top: 8px;
        }

        .history-item {
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-h);
          line-height: 1.4;
          transition: background 0.15s;
        }

        .history-item:hover {
          background: var(--accent-bg);
        }

        .history-item-title {
          font-weight: 500;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-item-date {
          font-size: 11px;
          color: var(--text);
        }

        /* Chat area */
        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .header {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 12px;
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

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .message-row {
          display: flex;
        }

        .message-row.user { justify-content: flex-end; }
        .message-row.assistant { justify-content: flex-start; }

        .bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 14px;
          font-size: 15px;
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

        .error-banner {
          margin: 0 24px 12px;
          padding: 12px 14px;
          background: #fee2e2;
          color: #991b1b;
          border-radius: 10px;
          font-size: 14px;
        }

        .input-area {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .input-row {
          display: flex;
          gap: 10px;
        }

        .chat-input {
          flex: 1;
          padding: 14px 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 15px;
          background: var(--bg);
          color: var(--text-h);
          outline: none;
          min-width: 0;
        }

        .send-btn {
          padding: 14px 22px;
          border: none;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          white-space: nowrap;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .send-btn.loading {
          background: var(--border);
          cursor: not-allowed;
        }

        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            width: 80%;
            max-width: 300px;
            box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          }

          .sidebar.sidebar-open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 99;
          }

          .menu-btn {
            display: block;
          }

          .header {
            padding: 12px 16px;
          }

          .messages {
            padding: 16px;
            gap: 14px;
          }

          .bubble {
            max-width: 85%;
            font-size: 14px;
          }

          .input-area {
            padding: 12px 16px;
          }

          .send-btn {
            padding: 14px 16px;
            font-size: 14px;
          }

          .error-banner {
            margin: 0 16px 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
