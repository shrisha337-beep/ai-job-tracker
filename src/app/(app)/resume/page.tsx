"use client";

import { useState, useRef, useCallback } from "react";

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
      setUploadSuccess(`✅ "${file.name}" uploaded successfully!`);
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
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Resume</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Upload your resume to enable AI match scoring across all applications
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer ${
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)]"
            : "border-[var(--color-border)] hover:border-[var(--color-surface-4)] hover:bg-[var(--color-surface-1)]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          className="hidden"
          onChange={handleFileChange}
          id="resume-file-input"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
            <p className="text-sm text-[var(--color-muted-foreground)]">Uploading and parsing resume...</p>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">
              Drop your resume here
            </h3>
            <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
              Supports TXT, PDF, DOC, DOCX · Max 5MB
            </p>
            <button className="btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
              Browse File
            </button>
            <p className="text-xs text-[var(--color-muted)] mt-3">
              💡 Tip: For best results, use a .txt version of your resume
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-4 rounded-xl bg-[var(--color-danger-muted)] border border-[rgba(244,63,94,0.2)] text-sm text-[var(--color-danger)]">
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="p-4 rounded-xl bg-[var(--color-success-muted)] border border-[rgba(16,185,129,0.2)] text-sm text-[var(--color-success)]">
          {uploadSuccess}
        </div>
      )}

      {/* Active resume */}
      {activeResume && (
        <div className="card-gradient">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                  {activeResume.filename}
                </h2>
                <span className="badge badge-success text-xs">Active</span>
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Uploaded {new Date(activeResume.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-3xl">✅</div>
          </div>

          {activeResume.parsedSkills.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">
                Detected Skills ({activeResume.parsedSkills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {activeResume.parsedSkills.map((skill) => (
                  <span key={skill} className="badge badge-primary text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume history */}
      {resumes.length > 1 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
            Previous Resumes
          </h2>
          <div className="space-y-2">
            {resumes.filter((r) => !r.isActive).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{r.filename}</p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {new Date(r.createdAt).toLocaleDateString()} · {r.parsedSkills.length} skills detected
                    </p>
                  </div>
                </div>
                <span className="badge badge-muted text-xs">Inactive</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no resumes yet */}
      {loaded && resumes.length === 0 && !uploading && (
        <div className="card text-center py-8">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No resume uploaded yet. Upload one above to start AI matching.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="card">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">
          🤖 How AI Matching Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Upload Resume", desc: "We extract your skills, experience, and keywords" },
            { step: "2", title: "Add a Job", desc: "Paste the JD when adding an application" },
            { step: "3", title: "Get Match Score", desc: "AI scores your fit and identifies gaps instantly" },
          ].map((item) => (
            <div key={item.step} className="text-center p-4 rounded-xl bg-[var(--color-surface-2)]">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-muted)] text-[var(--color-primary)] text-sm font-bold flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <p className="text-sm font-semibold text-[var(--color-foreground)] mb-1">{item.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
