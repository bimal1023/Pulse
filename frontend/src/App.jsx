import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8002";

function FormattedText({ text }) {
  if (!text) return null;
  return (
    <div className="md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="inline-link">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="2" width="6" height="11" rx="3" fill="currentColor"/>
    <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CAPABILITIES = [
  { icon: "⚡", label: "Web Search", desc: "Search anything on the web", prompt: "Search the web for the latest AI trends" },
  { icon: "📰", label: "News", desc: "Today's top stories", prompt: "What's happening in AI and tech today?" },
  { icon: "💼", label: "Jobs", desc: "Find matching roles", prompt: "Find the latest AI and ML engineering internships" },
  { icon: "📄", label: "Cover Letter", desc: "Generate in seconds", prompt: "Generate a cover letter for this job:" },
  { icon: "🔬", label: "Research", desc: "Latest Arxiv papers", prompt: "Find the latest Arxiv papers on large language models" },
  { icon: "💻", label: "GitHub", desc: "Trending repositories", prompt: "Show me trending Python repositories on GitHub" },
];

const TOOL_LABELS = {
  search_web: "Searching the web",
  get_news: "Reading the news",
  get_wikipedia_summary: "Checking Wikipedia",
  get_github_trending: "Browsing GitHub",
  get_arxiv_papers: "Scanning Arxiv",
  send_email: "Sending email",
  send_discord: "Posting to Discord",
  get_jobs: "Searching job boards",
  generate_cover_letter: "Writing cover letter",
  get_greenhouse_jobs: "Checking Greenhouse",
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [activeTool, setActiveTool] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [unlocked, setUnlocked] = useState(
    () => !!sessionStorage.getItem("pulse_token")
  );
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    "X-Auth-Token": sessionStorage.getItem("pulse_token") ?? "",
  });

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`, { headers: authHeaders() });
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
        headers: authHeaders(),
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
            setMessages((prev) => [...prev, { role: "assistant", content: fullAnswer }]);
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
      const res = await fetch(`${API_BASE}/history/${id}`, { headers: authHeaders() });
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
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome or Edge."); return; }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    recognitionRef.current = r;
    r.onresult = (e) => setInput(Array.from(e.results).map((x) => x[0].transcript).join(""));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    setListening(true);
  };

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE}/send-otp`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send code");
      setOtpSent(true);
    } catch (err) {
      setOtpError("Failed to send code. Try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Incorrect code");
      }
      sessionStorage.setItem("pulse_token", data.token);
      setUnlocked(true);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const isEmpty = messages.length === 0 && !loading;

  if (!unlocked) return (
    <div className="lock-screen">
      <div className="lock-box">

        {/* Logo */}
        <div className="lock-logo">
          <div className="lock-avatar">
            <span className="lock-avatar-dot" />
          </div>
          <span className="lock-logo-text">Pulse</span>
        </div>

        {/* Notice */}
        <div className="lock-notice">
          <span className="lock-notice-icon">🔒</span>
          <div>
            <p className="lock-notice-title">Private Access Only</p>
            <p className="lock-notice-sub">This assistant is built exclusively for <strong>Bimal</strong>. Unauthorized access is not permitted.</p>
          </div>
        </div>

        <div className="lock-divider" />

        {!otpSent ? (
          <>
            <p className="lock-sub">Send a one-time verification code to Bimal's email address.</p>
            <button className="lock-btn" onClick={handleSendOtp} disabled={otpLoading}>
              {otpLoading ? (
                <span className="lock-loading">Sending<span>.</span><span>.</span><span>.</span></span>
              ) : "Send Verification Code"}
            </button>
          </>
        ) : (
          <>
            <p className="lock-sub">Enter the 6-digit code sent to your email.</p>
            <div className="lock-input-wrap">
              <input
                type="text"
                inputMode="numeric"
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="lock-input"
                autoFocus
              />
            </div>
            <button className="lock-btn" onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 6}>
              {otpLoading ? (
                <span className="lock-loading">Verifying<span>.</span><span>.</span><span>.</span></span>
              ) : "Verify & Enter"}
            </button>
            <button className="lock-resend" onClick={() => { setOtpSent(false); setOtp(""); setOtpError(""); }}>
              ← Send a new code
            </button>
          </>
        )}

        {otpError && (
          <div className="lock-error">
            <span>⚠️</span> {otpError}
          </div>
        )}

        <p className="lock-footer">Pulse · Personal AI Agent</p>
      </div>
    </div>
  );

  return (
    <div className="shell">

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-dot" />
            <span className="logo-text">Pulse</span>
          </div>
        </div>

        <button className="new-chat-btn" onClick={startNewChat}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          New Chat
        </button>

        {history.length > 0 && (
          <div className="history-section">
            <div className="history-label">Recent</div>
            {history.map((item) => (
              <button key={item.id} className="history-item" onClick={() => loadHistoryItem(item.id)}>
                <span className="history-title">{item.task}</span>
                <span className="history-date">{new Date(item.timestamp).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sidebar-footer">
          <div className="footer-badge">
            <span className="footer-dot" />
            AI Agent Active
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">

        {/* Header */}
        <header className="header">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="header-center">
            <span className="header-logo">
              <span className="header-dot" />
              Pulse
            </span>
          </div>
          <div style={{ width: 40 }} />
        </header>

        {/* Messages */}
        <div className="messages">

          {isEmpty && (
            <div className="welcome">
              <div className="welcome-glow" />
              <div className="welcome-avatar">
                <span className="avatar-dot" />
              </div>
              <h1 className="welcome-title">
                {getGreeting()},<br />
                <span className="welcome-name">Bimal.</span>
              </h1>
              <p className="welcome-sub">Your personal AI — ask anything or pick a suggestion below.</p>

              <div className="capability-grid">
                {CAPABILITIES.map(({ icon, label, desc, prompt }) => (
                  <button key={label} className="cap-card" onClick={() => { setInput(prompt); inputRef.current?.focus(); }}>
                    <span className="cap-icon">{icon}</span>
                    <span className="cap-label">{label}</span>
                    <span className="cap-desc">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`row ${msg.role}`}>
              {msg.role === "assistant" && <div className="avatar"><span className="avatar-mini" /></div>}
              <div className={`bubble ${msg.role}`}>
                <FormattedText text={msg.content} />
              </div>
            </div>
          ))}

          {(streamingContent || activeTool) && (
            <div className="row assistant">
              <div className="avatar"><span className="avatar-mini" /></div>
              <div className="bubble assistant">
                {activeTool && !streamingContent && (
                  <div className="tool-status">
                    <span className="tool-dots">
                      <span /><span /><span />
                    </span>
                    {TOOL_LABELS[activeTool] ?? "Working..."}
                  </div>
                )}
                {streamingContent && <FormattedText text={streamingContent} />}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <div className="error-bar">{error}</div>}

        {/* Input */}
        <div className="input-wrap">
          <div className="input-box">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={listening ? "Listening..." : isEmpty ? "Ask me anything..." : "Ask a follow-up..."}
              className="input-field"
              disabled={loading}
            />
            <button
              onClick={toggleVoice}
              className={`icon-btn mic ${listening ? "active" : ""}`}
              title={listening ? "Stop" : "Voice input"}
            >
              <MicIcon />
            </button>
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="send-btn"
              title="Send"
            >
              <SendIcon />
            </button>
          </div>
          <p className="input-hint">Pulse can make mistakes. Verify important info.</p>
        </div>
      </main>

      <style>{`

        .shell {
          display: flex;
          height: 100svh;
          overflow: hidden;
          background: var(--bg);
          font-family: var(--sans);
        }

        /* ── Overlay ── */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 99;
          display: none;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 248px;
          flex-shrink: 0;
          background: var(--sidebar-bg);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sidebar-header {
          padding: 20px 16px 12px;
          border-bottom: 1px solid var(--border);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-h);
          letter-spacing: -0.02em;
        }

        .new-chat-btn {
          margin: 12px 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: transparent;
          color: var(--text-h);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          width: calc(100% - 24px);
        }
        .new-chat-btn:hover {
          background: var(--accent-bg);
          border-color: var(--accent-border);
          color: var(--accent);
        }

        .history-section {
          flex: 1;
          overflow-y: auto;
          padding: 16px 12px 0;
        }

        .history-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text);
          padding: 0 4px 8px;
        }

        .history-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          margin-bottom: 2px;
        }
        .history-item:hover { background: var(--accent-bg); }

        .history-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-h);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-date {
          font-size: 11px;
          color: var(--text);
        }

        .sidebar-footer {
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          margin-top: auto;
        }

        .footer-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text);
        }

        .footer-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 5px #22c55e;
          animation: blink 2s infinite;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── Main ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        /* ── Header ── */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 56px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }

        .menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-h);
          cursor: pointer;
          transition: background 0.15s;
        }
        .menu-btn:hover { background: var(--code-bg); }

        .header-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-h);
          letter-spacing: -0.02em;
        }

        .header-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        /* ── Messages ── */
        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          scroll-behavior: smooth;
        }

        /* ── Welcome ── */
        .welcome {
          margin: auto;
          padding: 32px 24px;
          max-width: 640px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          position: relative;
        }

        .welcome-glow {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 200px;
          background: radial-gradient(ellipse at center, var(--accent-bg) 0%, transparent 70%);
          pointer-events: none;
          border-radius: 50%;
        }

        .welcome-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .avatar-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 16px var(--accent);
          animation: pulse-glow 2.5s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 16px var(--accent); transform: scale(1); }
          50% { box-shadow: 0 0 28px var(--accent); transform: scale(1.08); }
        }

        .welcome-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-h);
          letter-spacing: -0.03em;
          text-align: center;
          line-height: 1.2;
        }

        .welcome-name {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-sub {
          font-size: 15px;
          color: var(--text);
          text-align: center;
          max-width: 400px;
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .capability-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: 100%;
        }

        .cap-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg);
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
        }
        .cap-card:hover {
          border-color: var(--accent-border);
          background: var(--accent-bg);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }

        .cap-icon { font-size: 18px; margin-bottom: 2px; }

        .cap-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-h);
        }

        .cap-desc {
          font-size: 11px;
          color: var(--text);
        }

        /* ── Message rows ── */
        .row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 6px 24px;
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }

        .row.user { justify-content: flex-end; }
        .row.assistant { justify-content: flex-start; }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent-bg);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .avatar-mini {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
        }

        .bubble {
          max-width: 78%;
          font-size: 15px;
          line-height: 1.7;
        }

        .bubble.user {
          background: var(--accent);
          color: #ffffff;
          padding: 10px 16px;
          border-radius: 18px;
          border-bottom-right-radius: 4px;
          font-size: 14px;
        }

        .bubble.assistant {
          color: var(--text-h);
          padding: 4px 0;
        }

        .inline-link {
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── Markdown ── */
        .md { font-size: 15px; line-height: 1.75; color: var(--text-h); }
        .bubble.user .md, .bubble.user .md * { color: #ffffff; }
        .md p { margin: 0 0 10px; }
        .md p:last-child { margin-bottom: 0; }
        .md h1, .md h2, .md h3 {
          color: var(--text-h);
          font-weight: 700;
          letter-spacing: -0.01em;
          margin: 16px 0 6px;
          line-height: 1.3;
        }
        .md h1 { font-size: 18px; }
        .md h2 { font-size: 16px; }
        .md h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text); }
        .md ul, .md ol {
          padding-left: 20px;
          margin: 6px 0 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .md li { line-height: 1.65; }
        .md li::marker { color: var(--accent); }
        .md strong { font-weight: 600; color: var(--text-h); }
        .md em { font-style: italic; }
        .md code {
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 1px 6px;
          font-size: 13px;
          font-family: var(--mono);
          color: var(--accent);
        }
        .md pre {
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 14px 16px;
          overflow-x: auto;
          margin: 10px 0;
        }
        .md pre code {
          background: none;
          border: none;
          padding: 0;
          color: var(--text-h);
          font-size: 13px;
        }
        .md blockquote {
          border-left: 3px solid var(--accent-border);
          padding-left: 14px;
          margin: 10px 0;
          color: var(--text);
          font-style: italic;
        }
        .md table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
          font-size: 14px;
        }
        .md th {
          background: var(--code-bg);
          padding: 8px 12px;
          text-align: left;
          font-weight: 600;
          color: var(--text-h);
          border: 1px solid var(--border);
        }
        .md td {
          padding: 8px 12px;
          border: 1px solid var(--border);
          color: var(--text-h);
        }
        .md tr:nth-child(even) td { background: var(--code-bg); }
        .md hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 14px 0;
        }

        /* ── Tool status ── */
        .tool-status {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--text);
          padding: 4px 0;
        }

        .tool-dots {
          display: flex;
          gap: 4px;
        }

        .tool-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          animation: dot-bounce 1.2s infinite ease-in-out;
        }
        .tool-dots span:nth-child(2) { animation-delay: 0.2s; }
        .tool-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* ── Error ── */
        .error-bar {
          margin: 0 24px 8px;
          padding: 10px 14px;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 10px;
          font-size: 13px;
          border: 1px solid #fecaca;
        }

        /* ── Input ── */
        .input-wrap {
          padding: 12px 24px 16px;
          flex-shrink: 0;
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
          align-self: center;
          width: 100%;
          padding: 12px 24px 16px;
        }

        .input-box {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--code-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 6px 6px 6px 18px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-box:focus-within {
          border-color: var(--accent-border);
          box-shadow: 0 0 0 3px var(--accent-bg);
        }

        .input-field {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 15px;
          color: var(--text-h);
          outline: none;
          padding: 8px 0;
          min-width: 0;
          font-family: var(--sans);
        }
        .input-field::placeholder { color: var(--text); }
        .input-field:disabled { opacity: 0.5; }

        .icon-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text);
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .icon-btn:hover { background: var(--border); color: var(--text-h); }
        .icon-btn.mic.active { color: #ef4444; animation: dot-bounce 1s infinite; }

        .send-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s, transform 0.15s;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.88; transform: scale(1.04); }
        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .input-hint {
          text-align: center;
          font-size: 11px;
          color: var(--text);
          margin-top: 8px;
          opacity: 0.7;
        }

        /* ── Mobile ── */
        @media (max-width: 680px) {
          .overlay { display: block; }

          .sidebar {
            position: fixed;
            top: 0; left: 0;
            height: 100%;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.12);
          }
          .sidebar.open { transform: translateX(0); }

          .menu-btn { display: flex; }
          .header { position: relative; }

          .messages { padding: 16px 0; }
          .row { padding: 4px 16px; }
          .bubble { max-width: 90%; font-size: 14px; }

          .welcome { padding: 24px 16px; }
          .welcome-title { font-size: 26px; }
          .capability-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }

          .input-wrap { padding: 10px 16px 14px; }
        }
      `}</style>
    </div>
  );
}
