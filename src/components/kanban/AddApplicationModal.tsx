"use client";

import { useState } from "react";
import type { Application, Status } from "@/types/application";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "BOOKMARKED", label: "Bookmarked" },
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

interface AddApplicationModalProps {
  onClose: () => void;
  onAdd: (app: Application) => void;
}

export function AddApplicationModal({ onClose, onAdd }: AddApplicationModalProps) {
  const [form, setForm] = useState({
    company: "",
    role: "",
    status: "BOOKMARKED" as Status,
    sourceUrl: "",
    location: "",
    salary: "",
    jobType: "",
    jdRaw: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create application");
      const { application } = await res.json();
      onAdd(application);
      onClose();
    } catch {
      setError("Failed to add application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="overlay animate-[fadeIn_0.15s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="dialog w-full max-w-lg animate-[scale-in_0.2s_cubic-bezier(0.16,1,0.3,1)]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                Add Application
              </h2>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                Track a new job opportunity
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label className="label" htmlFor="company">Company *</label>
                <input
                  id="company"
                  className="input"
                  placeholder="e.g. Google"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  required
                />
              </div>
              <div className="field-group">
                <label className="label" htmlFor="role">Role *</label>
                <input
                  id="role"
                  className="input"
                  placeholder="e.g. Senior Engineer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label className="label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="input select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="label" htmlFor="location">Location</label>
                <input
                  id="location"
                  className="input"
                  placeholder="e.g. Remote / Bangalore"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label className="label" htmlFor="salary">Salary Range</label>
                <input
                  id="salary"
                  className="input"
                  placeholder="e.g. ₹25-35 LPA"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label className="label" htmlFor="jobType">Job Type</label>
                <select
                  id="jobType"
                  className="input select"
                  value={form.jobType}
                  onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label className="label" htmlFor="sourceUrl">Job URL</label>
              <input
                id="sourceUrl"
                className="input"
                type="url"
                placeholder="https://linkedin.com/jobs/..."
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
              />
            </div>

            <div className="field-group">
              <label className="label" htmlFor="jdRaw">
                Job Description{" "}
                <span className="text-[var(--color-muted)]">(optional — paste to enable AI parsing)</span>
              </label>
              <textarea
                id="jdRaw"
                className="input textarea"
                rows={4}
                placeholder="Paste the full job description here..."
                value={form.jdRaw}
                onChange={(e) => setForm({ ...form, jdRaw: e.target.value })}
              />
            </div>

            {error && (
              <p className="field-error text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
                id="submit-application-btn"
              >
                {loading ? (
                  <div className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                ) : (
                  "Add Application"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
