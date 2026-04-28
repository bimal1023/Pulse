"use client";
import { useEffect, useState } from "react";
import type { Application, AppStatus } from "@/lib/store";
import StatusBadge, { STATUS_CONFIG } from "@/components/StatusBadge";

const STATUSES = Object.keys(STATUS_CONFIG) as AppStatus[];

function EmptyForm({
  onSave,
  onCancel,
  saving,
}: {
  onSave: (data: Omit<Application, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [university, setUniversity] = useState("");
  const [program, setProgram] = useState("");
  const [deadline, setDeadline] = useState("");
  const [interest, setInterest] = useState("");
  const [status, setStatus] = useState<AppStatus>("planning");

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-400";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Add Application</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            University *
          </label>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="MIT"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Program *
          </label>
          <input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="PhD Computer Science"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AppStatus)}
            className={inputCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Research Interest
          </label>
          <input
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            placeholder="e.g. Natural language processing"
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!university.trim() || !program.trim()) return;
            onSave({ university, program, deadline, interest, status });
          }}
          disabled={saving || !university.trim() || !program.trim()}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </div>
    </div>
  );
}

function AppRow({
  app,
  onStatusChange,
  onEdit,
  onDelete,
}: {
  app: Application;
  onStatusChange: (id: string, status: AppStatus) => void;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 group">
      {/* Colored dot */}
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_CONFIG[app.status].dot}`}
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{app.university}</p>
        <p className="text-xs text-gray-400 truncate">
          {app.program}
          {app.deadline && ` · ${app.deadline}`}
        </p>
      </div>

      {/* Status badge */}
      <div className="hidden sm:block flex-shrink-0">
        <StatusBadge status={app.status} />
      </div>

      {/* Inline status select */}
      <select
        value={app.status}
        onChange={(e) => onStatusChange(app.id, e.target.value as AppStatus)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 flex-shrink-0"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_CONFIG[s].label}
          </option>
        ))}
      </select>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onEdit(app)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          title="Edit"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(app.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EditRow({
  app,
  onSave,
  onCancel,
  saving,
}: {
  app: Application;
  onSave: (data: Partial<Application>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [university, setUniversity] = useState(app.university);
  const [program, setProgram] = useState(app.program);
  const [deadline, setDeadline] = useState(app.deadline);
  const [interest, setInterest] = useState(app.interest);
  const [status, setStatus] = useState<AppStatus>(app.status);

  const inputCls =
    "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <div className="px-5 py-4 space-y-3 bg-blue-50/40">
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Edit</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University" className={inputCls} />
        <input value={program} onChange={(e) => setProgram(e.target.value)} placeholder="Program" className={inputCls} />
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputCls} />
        <select value={status} onChange={(e) => setStatus(e.target.value as AppStatus)} className={inputCls}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <input value={interest} onChange={(e) => setInterest(e.target.value)} placeholder="Research interest" className={inputCls + " sm:col-span-2"} />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white transition-colors">
          Cancel
        </button>
        <button
          onClick={() => onSave({ university, program, deadline, interest, status })}
          disabled={saving}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchApps = () => {
    setLoading(true);
    fetch("/api/applications")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setApps(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApps(); }, []);

  const handleAdd = async (
    data: Omit<Application, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const app = await res.json();
      setApps((prev) => [app, ...prev]);
      setShowForm(false);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to add.");
    }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: AppStatus) => {
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const handleEdit = async (id: string, data: Partial<Application>) => {
    setSaving(true);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setApps((prev) => prev.map((a) => a.id === id ? updated : a));
      setEditId(null);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Applications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all your PhD program applications in one place.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          Add Application
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <EmptyForm
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : apps.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400 mb-3">No applications yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first application →
          </button>
        </div>
      ) : apps.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {apps.map((app) =>
            editId === app.id ? (
              <EditRow
                key={app.id}
                app={app}
                onSave={(data) => handleEdit(app.id, data)}
                onCancel={() => setEditId(null)}
                saving={saving}
              />
            ) : (
              <AppRow
                key={app.id}
                app={app}
                onStatusChange={handleStatusChange}
                onEdit={(a) => { setEditId(a.id); setShowForm(false); }}
                onDelete={handleDelete}
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
