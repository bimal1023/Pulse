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
  };

  const toolLabels = {
    search_web: "Searching the web...",
    get_news: "Reading news...",
    get_wikipedia_summary: "Looking up Wikipedia...",
  };

  return (
    <div style={{ display: "flex", height: "100svh", overflow: "hidden" }}>

      {/* Sidebar */}
      <div style={{
        width: "260px", flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "20px 16px", gap: "12px", overflowY: "auto"
      }}>
        <button
          onClick={startNewChat}
          style={{
            padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px",
            background: "transparent", color: "var(--text-h)", cursor: "pointer",
            fontSize: "14px", fontWeight: 500, textAlign: "left",
          }}
        >
          + New Chat
        </button>

        <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "var(--text)", textTransform: "uppercase", marginTop: "8px" }}>
          History
        </div>

        {history.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--text)" }}>No history yet.</p>
        )}

        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => loadHistoryItem(item.id)}
            style={{
              padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
              fontSize: "13px", color: "var(--text-h)", lineHeight: 1.4,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <div style={{ fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.task}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text)" }}>
              {new Date(item.timestamp).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: "20px" }}>Pulse</h1>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {messages.length === 0 && !loading && (
            <div style={{ margin: "auto", textAlign: "center", color: "var(--text)" }}>
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>Ask me anything.</p>
              <p style={{ fontSize: "13px" }}>I can search the web, read news, and look up Wikipedia.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "70%", padding: "12px 16px", borderRadius: "14px", fontSize: "15px",
                background: msg.role === "user" ? "var(--accent)" : "var(--code-bg)",
                color: msg.role === "user" ? "white" : "var(--text-h)",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "14px",
                borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "14px",
              }}>
                <FormattedText text={msg.content} />
              </div>
            </div>
          ))}

          {/* Streaming bubble */}
          {(streamingContent || activeTool) && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                maxWidth: "70%", padding: "12px 16px", borderRadius: "14px",
                borderBottomLeftRadius: "4px", fontSize: "15px",
                background: "var(--code-bg)", color: "var(--text-h)",
              }}>
                {activeTool && !streamingContent && (
                  <span style={{ color: "var(--accent)", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: "pulse 1s infinite" }} />
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
          <div style={{ margin: "0 24px 12px", padding: "12px 14px", background: "#fee2e2", color: "#991b1b", borderRadius: "10px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={messages.length > 0 ? "Ask a follow-up..." : "Ask anything..."}
              style={{
                flex: 1, padding: "14px 16px",
                border: "1px solid var(--border)", borderRadius: "10px",
                fontSize: "15px", background: "var(--bg)",
                color: "var(--text-h)", outline: "none",
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: "14px 22px", border: "none", borderRadius: "10px",
                background: loading ? "var(--border)" : "var(--accent)",
                color: "white", cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px", fontWeight: 500, whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

export default App;
