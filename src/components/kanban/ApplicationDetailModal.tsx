"use client";

import { useState, useEffect, useTransition } from "react";
import type { Application, Status } from "@/types/application";
import { 
  X, 
  Building, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  Link2, 
  Calendar, 
  Sparkles, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  AlertCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface Resume {
  id: string;
  filename: string;
  parsedSkills: string[];
  isActive: boolean;
  createdAt: string;
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "BOOKMARKED", label: "Bookmarked" },
  { value: "APPLIED", label: "Applied" },
  { value: "SCREENING", label: "Screening" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OFFER", label: "Offer" },
  { value: "REJECTED", label: "Rejected" },
];

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onUpdate: (app: Application) => void;
}

export function ApplicationDetailModal({
  application,
  onClose,
  onUpdate,
}: ApplicationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "jd" | "match">("details");
  const [notes, setNotes] = useState(application.notes || "");
  const [jdRaw, setJdRaw] = useState(application.jdRaw || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [status, setStatus] = useState<Status>(application.status);
  
  // Inline edit state for core info
  const [location, setLocation] = useState(application.location || "");
  const [salary, setSalary] = useState(application.salary || "");
  const [jobType, setJobType] = useState(application.jobType || "");
  const [sourceUrl, setSourceUrl] = useState(application.sourceUrl || "");
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Resume states
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // AI execution states
  const [isParsingJd, setIsParsingJd] = useState(false);
  const [isMatchingResume, setIsMatchingResume] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Collapsible section states (collapsed by default per implementation plan)
  const [openJdSummary, setOpenJdSummary] = useState(true);
  const [openJdSkills, setOpenJdSkills] = useState(false);
  const [openJdResp, setOpenJdResp] = useState(false);
  const [openJdPerks, setOpenJdPerks] = useState(false);

  const [openMatchSkills, setOpenMatchSkills] = useState(true);
  const [openMatchStrengths, setOpenMatchStrengths] = useState(false);
  const [openMatchAts, setOpenMatchAts] = useState(false);

  const [, startTransition] = useTransition();

  // Load resumes when mounting
  useEffect(() => {
    async function fetchResumes() {
      setLoadingResumes(true);
      try {
        const res = await fetch("/api/resume");
        if (res.ok) {
          const { resumes: data } = await res.json();
          setResumes(data);
          setActiveResume(data.find((r: Resume) => r.isActive) || data[0] || null);
        }
      } catch (err) {
        console.error("Failed to load resumes", err);
      } finally {
        setLoadingResumes(false);
      }
    }
    fetchResumes();
  }, []);

  // Sync state if application prop changes
  useEffect(() => {
    setNotes(application.notes || "");
    setJdRaw(application.jdRaw || "");
    setStatus(application.status);
    setLocation(application.location || "");
    setSalary(application.salary || "");
    setJobType(application.jobType || "");
    setSourceUrl(application.sourceUrl || "");
  }, [application]);

  const showFeedback = (msg: string, isErr = false) => {
    if (isErr) {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleStatusChange = (newStatus: Status) => {
    setStatus(newStatus);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/applications/${application.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          const { application: updated } = await res.json();
          onUpdate(updated);
          showFeedback("Status updated");
        }
      } catch {
        showFeedback("Failed to update status", true);
      }
    });
  };

  const saveNotes = async () => {
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        const { application: updated } = await res.json();
        onUpdate(updated);
        setIsEditingNotes(false);
        showFeedback("Notes saved");
      }
    } catch {
      showFeedback("Failed to save notes", true);
    }
  };

  const saveJd = async () => {
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdRaw }),
      });
      if (res.ok) {
        const { application: updated } = await res.json();
        onUpdate(updated);
        setIsEditingJd(false);
        showFeedback("Job description saved");
      }
    } catch {
      showFeedback("Failed to save job description", true);
    }
  };

  const saveInfo = async () => {
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          salary,
          jobType,
          sourceUrl,
        }),
      });
      if (res.ok) {
        const { application: updated } = await res.json();
        onUpdate(updated);
        setIsEditingInfo(false);
        showFeedback("Details updated");
      }
    } catch {
      showFeedback("Failed to update details", true);
    }
  };

  const handleParseJd = async () => {
    if (!jdRaw.trim()) {
      setError("Please paste a job description first");
      return;
    }
    setIsParsingJd(true);
    setError("");
    try {
      const res = await fetch("/api/ai/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, jdText: jdRaw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse job description");
      
      const refreshRes = await fetch(`/api/applications/${application.id}`);
      if (refreshRes.ok) {
        const { application: updated } = await refreshRes.json();
        onUpdate(updated);
        showFeedback("AI parsing complete!");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsParsingJd(false);
    }
  };

  const handleMatchResume = async () => {
    if (!activeResume) {
      setError("Please upload a resume first");
      return;
    }
    setIsMatchingResume(true);
    setError("");
    try {
      const res = await fetch("/api/ai/match-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id, resumeId: activeResume.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to calculate match score");

      const refreshRes = await fetch(`/api/applications/${application.id}`);
      if (refreshRes.ok) {
        const { application: updated } = await refreshRes.json();
        onUpdate(updated);
        showFeedback("AI Match score calculated!");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsMatchingResume(false);
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] border-[var(--color-border)]";
    if (score >= 75) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    if (score >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/30";
    return "text-red-500 bg-red-500/10 border-red-500/30";
  };

  const parsedJdData = application.jdParsed as any;
  const matchAnalysis = application.matchAnalysis as any;

  return (
    <>
      {/* Backdrop */}
      <div
        className="overlay animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-[var(--color-surface-1)] border-l border-[var(--color-border)] shadow-2xl flex flex-col h-full animate-[slideIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between bg-[var(--color-surface-0)]">
          <div className="space-y-1 flex-1 mr-4">
            <span className="text-xs font-semibold text-[var(--color-primary)]">
              Application Details
            </span>
            <h2 className="text-xl font-bold text-[var(--color-foreground)] line-clamp-1">
              {application.role}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)]">
              <Building className="w-4 h-4 text-[var(--color-muted)]" />
              <span className="font-medium text-[var(--color-foreground)]">{application.company}</span>
              <span className="text-[var(--color-muted)]">•</span>
              <Calendar className="w-3.5 h-3.5" />
              <span>Added {new Date(application.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Select */}
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as Status)}
              className="input select text-xs py-1.5 px-3 h-auto min-w-[120px] rounded-[6px]"
              id="detail-status-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={onClose}
              className="p-2 rounded-[6px] hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {success && (
          <div className="mx-6 mt-4 p-3 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-[6px] bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="px-6 border-b border-[var(--color-border)] flex gap-4 bg-[var(--color-surface-0)]">
          {[
            { id: "details", label: "Details & Notes" },
            { id: "jd", label: "Job Description (AI)", badge: parsedJdData ? "Parsed" : null },
            { id: "match", label: "Resume Matcher (AI)", badge: application.matchScore !== null ? `${application.matchScore}%` : null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all relative ${
                activeTab === tab.id
                  ? "border-[var(--color-primary)] text-[var(--color-foreground)]"
                  : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-semibold tracking-wider ${
                  tab.id === "match" 
                    ? application.matchScore && application.matchScore >= 75 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: DETAILS & NOTES */}
          {activeTab === "details" && (
            <>
              {/* Job Info Grid */}
              <div className="card space-y-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                    Core Information
                  </h3>
                  <button
                    onClick={() => {
                      if (isEditingInfo) saveInfo();
                      else setIsEditingInfo(true);
                    }}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1"
                  >
                    {isEditingInfo ? "Save Info" : "Edit Details"}
                  </button>
                </div>

                {isEditingInfo ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">Location</label>
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="input text-xs w-full mt-1"
                          placeholder="e.g. Remote / SF"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">Salary</label>
                        <input
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          className="input text-xs w-full mt-1"
                          placeholder="e.g. $120k-$150k"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">Job Type</label>
                        <select
                          value={jobType}
                          onChange={(e) => setJobType(e.target.value)}
                          className="input select text-xs w-full mt-1"
                        >
                          <option value="">Select type</option>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                          <option value="Freelance">Freelance</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase">Job Link</label>
                        <input
                          value={sourceUrl}
                          onChange={(e) => setSourceUrl(e.target.value)}
                          className="input text-xs w-full mt-1"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
                      <MapPin className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Location</p>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">{application.location || "Not specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
                      <DollarSign className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Salary Range</p>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">{application.salary || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
                      <Briefcase className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Employment Type</p>
                        <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">{application.jobType || "Not specified"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-3 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
                      <Link2 className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      <div>
                        <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Job Source</p>
                        {application.sourceUrl ? (
                          <a 
                            href={application.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[var(--color-primary)] hover:underline truncate block max-w-[200px]"
                          >
                            Link to Posting
                          </a>
                        ) : (
                          <p className="text-xs font-semibold text-[var(--color-muted-foreground)]">None</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="card space-y-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                    Notes
                  </h3>
                  <button
                    onClick={() => {
                      if (isEditingNotes) saveNotes();
                      else setIsEditingNotes(true);
                    }}
                    className="text-xs text-[var(--color-primary)] font-medium hover:underline"
                  >
                    {isEditingNotes ? "Save Notes" : "Edit Notes"}
                  </button>
                </div>
                {isEditingNotes ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input textarea w-full text-xs"
                    rows={8}
                    placeholder="Add interview notes, call logs, follow-up reminders..."
                  />
                ) : (
                  <div className="p-4 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)] min-h-[120px] whitespace-pre-wrap text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                    {application.notes ? application.notes : "No notes written yet. Add notes about your interviews, questions, or next steps."}
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: JOB DESCRIPTION (AI) */}
          {activeTab === "jd" && (
            <div className="space-y-4">
              {/* Parse Controller / Raw JD Card */}
              <div className="card space-y-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                    Job Description Text
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (isEditingJd) saveJd();
                        else setIsEditingJd(true);
                      }}
                      className="text-xs text-[var(--color-primary)] font-medium hover:underline"
                    >
                      {isEditingJd ? "Save JD" : "Edit JD"}
                    </button>
                    {jdRaw.trim() && !isEditingJd && (
                      <button
                        onClick={handleParseJd}
                        disabled={isParsingJd}
                        className="btn-primary text-xs py-1.5 px-3 h-auto flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isParsingJd ? "Extracting..." : "Extract Requirements"}
                      </button>
                    )}
                  </div>
                </div>

                {isEditingJd ? (
                  <textarea
                    value={jdRaw}
                    onChange={(e) => setJdRaw(e.target.value)}
                    className="input textarea w-full text-xs"
                    rows={10}
                    placeholder="Paste the full job description text here..."
                  />
                ) : jdRaw ? (
                  <details className="group border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-0)]">
                    <summary className="p-3 text-xs font-semibold text-[var(--color-muted-foreground)] cursor-pointer list-none flex items-center justify-between">
                      <span>View Raw Job Description</span>
                      <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="p-4 border-t border-[var(--color-border)] max-h-60 overflow-y-auto text-xs text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-wrap">
                      {jdRaw}
                    </div>
                  </details>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-[var(--color-border)] rounded-[6px]">
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
                      No job description saved. Paste it to enable AI skill breakdown and match scoring.
                    </p>
                    <button
                      onClick={() => setIsEditingJd(true)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      Paste Job Description
                    </button>
                  </div>
                )}
              </div>

              {/* Parsed Output */}
              {isParsingJd && (
                <div className="card flex flex-col items-center justify-center py-10 space-y-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
                  <div className="loading-spinner" />
                  <p className="text-xs text-[var(--color-muted-foreground)]">Extracting skills, qualifications, and role details...</p>
                </div>
              )}

              {parsedJdData && !isParsingJd && (
                <div className="space-y-3">
                  {/* Collapsible Section 1: Summary */}
                  <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                    <button
                      onClick={() => setOpenJdSummary(!openJdSummary)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                        <Sparkles size={16} className="text-[var(--color-primary)]" />
                        AI Analysis Summary
                      </span>
                      {openJdSummary ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openJdSummary && (
                      <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 space-y-3">
                        {parsedJdData.company_description && (
                          <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed italic bg-[var(--color-surface-0)] p-3 rounded-[6px] border border-[var(--color-border)]">
                            &ldquo;{parsedJdData.company_description}&rdquo;
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Experience Level</p>
                            <p className="text-xs font-semibold text-[var(--color-foreground)] mt-0.5">{parsedJdData.years_experience || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium text-[var(--color-muted-foreground)] uppercase">Education Required</p>
                            <p className="text-xs font-semibold text-[var(--color-foreground)] mt-0.5">{parsedJdData.education_required || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Section 2: Skills */}
                  <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                    <button
                      onClick={() => setOpenJdSkills(!openJdSkills)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-500" />
                        Required & Preferred Skills ({((parsedJdData.required_skills?.length || 0) + (parsedJdData.preferred_skills?.length || 0))})
                      </span>
                      {openJdSkills ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openJdSkills && (
                      <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-1.5">Required Skills:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedJdData.required_skills?.map((skill: string) => (
                              <span key={skill} className="badge badge-primary text-[10px] py-0.5 px-2">
                                {skill}
                              </span>
                            )) || <span className="text-xs text-[var(--color-muted-foreground)]">None</span>}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[var(--color-border)]">
                          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-1.5">Preferred Skills:</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {parsedJdData.preferred_skills?.map((skill: string) => (
                              <span key={skill} className="badge badge-success text-[10px] py-0.5 px-2">
                                {skill}
                              </span>
                            )) || <span className="text-xs text-[var(--color-muted-foreground)]">None</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Section 3: Responsibilities */}
                  {parsedJdData.responsibilities && parsedJdData.responsibilities.length > 0 && (
                    <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                      <button
                        onClick={() => setOpenJdResp(!openJdResp)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                          <Briefcase size={16} className="text-blue-500" />
                          Key Responsibilities ({parsedJdData.responsibilities.length})
                        </span>
                        {openJdResp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {openJdResp && (
                        <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2">
                          <ul className="space-y-1.5 text-xs text-[var(--color-muted-foreground)] pl-4 list-disc leading-relaxed pt-2">
                            {parsedJdData.responsibilities.map((resp: string, idx: number) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible Section 4: Perks & Benefits */}
                  {parsedJdData.perks && parsedJdData.perks.length > 0 && (
                    <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                      <button
                        onClick={() => setOpenJdPerks(!openJdPerks)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                          <Sparkles size={16} className="text-amber-500" />
                          Benefits & Perks ({parsedJdData.perks.length})
                        </span>
                        {openJdPerks ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      {openJdPerks && (
                        <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 pt-2">
                          <div className="flex flex-wrap gap-1.5">
                            {parsedJdData.perks.map((perk: string) => (
                              <span key={perk} className="badge badge-muted text-[10px] py-0.5 px-2">
                                {perk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESUME MATCHER (AI) */}
          {activeTab === "match" && (
            <div className="space-y-4">
              
              {/* Active Resume Selection Card */}
              <div className="card space-y-4 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                  Target Resume
                </h3>

                {loadingResumes ? (
                  <div className="text-xs text-[var(--color-muted-foreground)]">Loading resumes...</div>
                ) : activeResume ? (
                  <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)]">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">{activeResume.filename}</p>
                      <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
                        Active Resume · {activeResume.parsedSkills.length} skills detected
                      </p>
                    </div>
                    {jdRaw.trim() && (
                      <button
                        onClick={handleMatchResume}
                        disabled={isMatchingResume}
                        className="btn-primary text-xs py-1.5 px-3 h-auto flex items-center gap-1.5"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        {isMatchingResume ? "Analyzing..." : "Compare & Score"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-0)]">
                    <p className="text-xs text-[var(--color-muted-foreground)] mb-3">
                      You haven't uploaded a resume yet. Upload your resume to enable ATS match scoring.
                    </p>
                    <a href="/resume" className="btn-primary text-xs py-1.5 px-3 h-auto inline-block">
                      Go to Resume Page
                    </a>
                  </div>
                )}
                
                {activeResume && !jdRaw.trim() && (
                  <div className="p-3 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Please add the job description on the <strong>Job Description</strong> tab to compute a match score.</span>
                  </div>
                )}
              </div>

              {/* Analysis Loading */}
              {isMatchingResume && (
                <div className="card flex flex-col items-center justify-center py-10 space-y-3 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
                  <div className="loading-spinner" />
                  <p className="text-xs text-[var(--color-muted-foreground)]">AI is calculating keyword match and qualification alignment...</p>
                </div>
              )}

              {/* Match Output */}
              {application.matchScore !== null && !isMatchingResume && (
                <div className="space-y-3">
                  
                  {/* Score Card */}
                  <div className="card flex items-center gap-5 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-xs">
                    <div className={`w-16 h-16 rounded-[6px] border-2 flex flex-col items-center justify-center shrink-0 ${getScoreColor(application.matchScore)}`}>
                      <span className="text-2xl font-black">{application.matchScore}%</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Match</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--color-foreground)]">Grade: {matchAnalysis?.grade || "B"}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-2)] text-[var(--color-foreground)] border border-[var(--color-border)]">
                          Likelihood: {matchAnalysis?.interview_likelihood || "Medium"}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                        {matchAnalysis?.summary || "Your resume has been evaluated against the job specifications."}
                      </p>
                    </div>
                  </div>

                  {/* Collapsible Section 1: Skills Breakdown */}
                  <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                    <button
                      onClick={() => setOpenMatchSkills(!openMatchSkills)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-500" />
                        Matched & Missing Skills
                      </span>
                      {openMatchSkills ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openMatchSkills && (
                      <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
                            Matched Skills ({matchAnalysis?.matched_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchAnalysis?.matched_skills?.map((skill: string) => (
                              <span key={skill} className="badge badge-success text-[10px] py-0.5 px-2">
                                {skill}
                              </span>
                            )) || <span className="text-xs text-[var(--color-muted-foreground)]">None</span>}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[var(--color-border)]">
                          <h4 className="text-xs font-semibold text-red-500 mb-1.5">
                            Missing Skills ({matchAnalysis?.missing_skills?.length || 0})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {matchAnalysis?.missing_skills?.map((skill: string) => (
                              <span key={skill} className="badge badge-danger text-[10px] py-0.5 px-2">
                                {skill}
                              </span>
                            )) || <span className="text-xs text-[var(--color-muted-foreground)]">None</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Section 2: Strengths & Gaps */}
                  <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                    <button
                      onClick={() => setOpenMatchStrengths(!openMatchStrengths)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-500" />
                        Strengths & Gap Analysis
                      </span>
                      {openMatchStrengths ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openMatchStrengths && (
                      <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 space-y-3">
                        <div>
                          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-1">Resume Strengths:</h4>
                          <ul className="space-y-1 text-xs text-[var(--color-muted-foreground)] pl-4 list-disc leading-relaxed">
                            {matchAnalysis?.strengths?.map((str: string, idx: number) => (
                              <li key={idx}>{str}</li>
                            )) || <li>Strong baseline qualification match.</li>}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-[var(--color-border)]">
                          <h4 className="text-xs font-semibold text-[var(--color-foreground)] mb-1">Gap Analysis:</h4>
                          <ul className="space-y-1 text-xs text-[var(--color-muted-foreground)] pl-4 list-disc leading-relaxed">
                            {matchAnalysis?.gaps?.map((gap: string, idx: number) => (
                              <li key={idx}>{gap}</li>
                            )) || <li>No major gaps detected.</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Section 3: ATS Keywords & Suggestions */}
                  <div className="border border-[var(--color-border)] rounded-[6px] bg-[var(--color-surface-1)] overflow-hidden">
                    <button
                      onClick={() => setOpenMatchAts(!openMatchAts)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
                    >
                      <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
                        <Cpu size={16} className="text-[var(--color-primary)]" />
                        ATS Keywords & Suggestions
                      </span>
                      {openMatchAts ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {openMatchAts && (
                      <div className="p-4 pt-0 border-t border-[var(--color-border)] mt-2 space-y-3">
                        {matchAnalysis?.ats_keywords && matchAnalysis.ats_keywords.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase mb-1">Keywords to Integrate:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {matchAnalysis.ats_keywords.map((kw: string) => (
                                <span key={kw} className="badge badge-primary text-[10px] py-0.5 px-2">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-[var(--color-border)]">
                          <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase mb-1">Optimization Tips:</p>
                          <ul className="space-y-1 text-xs text-[var(--color-muted-foreground)] pl-4 list-disc leading-relaxed">
                            {matchAnalysis?.suggestions?.map((sugg: string, idx: number) => (
                              <li key={idx}>{sugg}</li>
                            )) || <li>Ensure key skills are prominently listed in your resume summary.</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
