"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Upload, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Cpu } from "lucide-react";

interface Resume {
  id: string;
  filename: string;
  parsedSkills: string[];
  isActive: boolean;
  createdAt: string;
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load resumes on mount
  const loadResumes = useCallback(async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const { resumes: data } = await res.json();
        setResumes(data);
        setActiveResume(data.find((r: Resume) => r.isActive) || data[0] || null);
        setLoaded(true);
      }
    } catch {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    loadResumes();
  }

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });
      
      let errorMsg = "Upload failed";
      let data = null;
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
        if (data && data.error) {
          errorMsg = data.error;
        }
      } else {
        const text = await res.text();
        errorMsg = `Server error (${res.status}): ${text.substring(0, 100)}`;
      }
      
      if (!res.ok) throw new Error(errorMsg);
      setUploadSuccess(`"${file.name}" uploaded and parsed successfully.`);
      await loadResumes();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">Resume</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Upload your resume for skill extraction and automated job matching
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`relative border-2 border-dashed rounded-[6px] p-10 text-center transition-colors cursor-pointer bg-[var(--color-surface-1)] ${
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-surface-2)]"
            : "border-[var(--color-border)] hover:border-[var(--color-primary)]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={handleFileChange}
          id="resume-file-input"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="loading-spinner" />
            <p className="text-xs font-mono text-[var(--color-muted-foreground)]">Parsing resume structure and skills...</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 border border-[var(--color-border)] bg-[var(--color-surface-2)] rounded-[6px] flex items-center justify-center mx-auto mb-3 text-[var(--color-foreground)]">
              <Upload size={20} />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">
              Drop your resume here
            </h3>
            <p className="text-xs text-[var(--color-muted-foreground)] mb-4">
              Supported formats: PDF, TXT · Maximum size: 5MB
            </p>
            <button
              className="btn-primary text-xs px-4 py-2"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Select File
            </button>
            <p className="text-[11px] text-[var(--color-muted)] mt-4">
              PDF files are extracted locally and parsed securely for technical skills.
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 text-xs font-mono text-red-500 rounded-[6px] flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadSuccess && (
        <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-xs font-mono text-emerald-500 rounded-[6px] flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Active resume */}
      {activeResume && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] p-5 shadow-xs">
          <div className="flex items-start justify-between mb-4 border-b border-[var(--color-border)] pb-3">
            <div>
              <span className="text-[11px] font-medium text-[var(--color-muted-foreground)] block mb-1">
                Active Resume
              </span>
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">{activeResume.filename}</h2>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Uploaded: {new Date(activeResume.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="badge badge-success text-[10px]">
              Active
            </span>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase mb-2">
              Detected Skills ({activeResume.parsedSkills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {activeResume.parsedSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[4px] text-xs text-[var(--color-foreground)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Previous resumes */}
      {resumes.length > 1 && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-3">
            Document Archive
          </h3>
          <div className="space-y-2">
            {resumes.filter((r) => r.id !== activeResume?.id).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-[var(--color-surface-0)] border border-[var(--color-border)] rounded-[6px]"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[var(--color-muted-foreground)]" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-foreground)]">{r.filename}</p>
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">
                      {new Date(r.createdAt).toLocaleDateString()} · {r.parsedSkills.length} skills indexed
                    </p>
                  </div>
                </div>
                <span className="badge badge-muted text-[10px]">Archived</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no resumes yet */}
      {loaded && resumes.length === 0 && !uploading && (
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] text-center py-8 p-6">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No resume uploaded yet. Upload a resume document to enable qualification and ATS matching.
          </p>
        </div>
      )}

      {/* How it works (Collapsible Accordion per implementation plan) */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] overflow-hidden">
        <button
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <span className="text-sm font-semibold text-[var(--color-foreground)] flex items-center gap-2">
            <Cpu size={16} className="text-[var(--color-primary)]" />
            How resume matching works
          </span>
          {showHowItWorks ? (
            <ChevronDown size={16} className="text-[var(--color-muted-foreground)]" />
          ) : (
            <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
          )}
        </button>

        {showHowItWorks && (
          <div className="p-5 pt-0 border-t border-[var(--color-border)] mt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {[
                { step: "01", title: "Document Ingestion", desc: "Extract candidate competencies, technical skills, and experience keywords." },
                { step: "02", title: "Job Spec Extraction", desc: "Parse raw job postings into structured skill requirements and salary benchmarks." },
                { step: "03", title: "Gap Calculation", desc: "Compute match percentage and highlight qualification discrepancies directly on the card." },
              ].map((item) => (
                <div key={item.step} className="p-4 bg-[var(--color-surface-0)] border border-[var(--color-border)] rounded-[6px]">
                  <div className="text-xs font-mono font-bold text-[var(--color-primary)] mb-2 border-b border-[var(--color-border)] pb-1">
                    STAGE {item.step}
                  </div>
                  <p className="text-xs font-bold text-[var(--color-foreground)] mb-1">{item.title}</p>
                  <p className="text-[12px] text-[var(--color-muted-foreground)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
