"use client";
import { useState } from "react";
import LoadingCard from "@/components/LoadingCard";
import ResultCard from "@/components/ResultCard";

export default function EmailPage() {
  const [professorName, setProfessorName] = useState("");
  const [university, setUniversity] = useState("");
  const [researchInterest, setResearchInterest] = useState("");
  const [statementSnippet, setStatementSnippet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400";
  const labelCls =
    "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/agents/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorName, university, researchInterest, statementSnippet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate email.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Email Drafter</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a personalized professor outreach email using AI.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Professor Name</label>
            <input
              type="text"
              placeholder="Dr. Jane Smith"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>University</label>
            <input
              type="text"
              placeholder="MIT"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Research Interest (optional)</label>
            <input
              type="text"
              placeholder="e.g. Natural language processing, climate modeling"
              value={researchInterest}
              onChange={(e) => setResearchInterest(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Personal Statement Snippet (optional)</label>
            <textarea
              rows={4}
              placeholder="Paste a relevant excerpt from your statement of purpose..."
              value={statementSnippet}
              onChange={(e) => setStatementSnippet(e.target.value)}
              className={inputCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Draft Email
          </button>
        </form>
      </div>

      {loading && <LoadingCard message="Drafting your email..." />}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && <ResultCard label="Drafted Email" content={result} />}
    </div>
  );
}
