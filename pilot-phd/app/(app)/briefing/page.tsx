"use client";
import { useState } from "react";
import LoadingCard from "@/components/LoadingCard";
import ResultCard from "@/components/ResultCard";

export default function BriefingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/agents/daily-briefing");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate briefing.");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Daily Briefing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get a personalized briefing with action items, tips, and motivation — powered by your application data.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">☀️</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">Today&apos;s Briefing</p>
            <p className="text-xs text-gray-400">{today}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          Your briefing is generated fresh each day using your current application statuses,
          upcoming deadlines, and your progress so far. Click below to generate it.
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Generate My Briefing
        </button>
      </div>

      {loading && <LoadingCard message="Generating your briefing..." />}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && <ResultCard label="Your Daily Briefing" content={result} showCopy={false} />}
    </div>
  );
}
