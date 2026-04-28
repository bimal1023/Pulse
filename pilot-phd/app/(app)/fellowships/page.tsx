"use client";
import { useState } from "react";
import LoadingCard from "@/components/LoadingCard";
import ResultCard from "@/components/ResultCard";

export default function FellowshipsPage() {
  const [researchInterest, setResearchInterest] = useState("");
  const [profile, setProfile] = useState("");
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
      const res = await fetch("/api/agents/find-fellowships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ researchInterest, profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to find fellowships.");
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fellowship Finder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Discover fellowships and funding opportunities matched to your research profile.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Research Interest</label>
            <input
              type="text"
              placeholder="e.g. Machine learning, computational biology, astrophysics"
              value={researchInterest}
              onChange={(e) => setResearchInterest(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Profile (optional)</label>
            <textarea
              rows={4}
              placeholder="Describe your background, citizenship, year of study, GPA, etc."
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className={inputCls + " resize-none"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Find Fellowships
          </button>
        </form>
      </div>

      {loading && <LoadingCard message="Searching for fellowships..." />}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && <ResultCard label="Matching Fellowships" content={result} />}
    </div>
  );
}
