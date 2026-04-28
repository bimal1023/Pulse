"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Application } from "@/lib/store";
import StatusBadge from "@/components/StatusBadge";

const TOOLS = [
  { href: "/email",      icon: "✉️",  title: "Email Drafter",    desc: "Draft professor outreach" },
  { href: "/statement",  icon: "📝",  title: "Statement Refiner", desc: "Polish your SOP" },
  { href: "/fellowships",icon: "🏆",  title: "Fellowship Finder", desc: "Find funding" },
  { href: "/briefing",   icon: "☀️",  title: "Daily Briefing",   desc: "Your action items" },
];

export default function DashboardPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setApps(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: apps.length,
    submitted: apps.filter((a) => a.status === "applied").length,
    waiting: apps.filter((a) => a.status === "waiting").length,
    accepted: apps.filter((a) => a.status === "accepted").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-gray-400 mt-1">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",     value: stats.total,     color: "text-gray-900" },
          { label: "Submitted", value: stats.submitted, color: "text-blue-600" },
          { label: "Waiting",   value: stats.waiting,   color: "text-amber-600" },
          { label: "Accepted",  value: stats.accepted,  color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-5 transition-colors"
          >
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent applications
          </h2>
          <Link
            href="/applications"
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : apps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-sm text-gray-400 mb-3">No applications yet.</p>
            <Link
              href="/applications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first application →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
            {apps.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {app.university}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {app.program}
                    {app.deadline && ` · Due ${app.deadline}`}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tools grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">AI Tools</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {TOOLS.map(({ href, icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 p-5 transition-colors group"
            >
              <span className="text-2xl mb-3 block">{icon}</span>
              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                {title}
              </p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
