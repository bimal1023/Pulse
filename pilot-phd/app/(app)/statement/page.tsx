"use client";
import { useState } from "react";
import LoadingCard from "@/components/LoadingCard";
import ResultCard from "@/components/ResultCard";

export default function StatementPage() {
  const [statement, setStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/agents/refine-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statement }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to refine statement.");
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Statement Refiner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste your personal statement and get AI-powered feedback with a refined version.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Personal Statement
            </label>
            <textarea
              rows={12}
              placeholder="Paste your statement of purpose here..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !statement.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Refine Statement
          </button>
        </form>
      </div>

      {loading && <LoadingCard message="Analyzing and refining your statement..." />}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && <ResultCard label="Feedback & Refined Version" content={result} />}
    </div>
  );
}
