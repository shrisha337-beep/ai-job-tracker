"use client";

import { useState, useRef, useCallback } from "react";
import { FileText, Upload, CheckCircle2, AlertCircle, Cpu } from "lucide-react";

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
      <div className="border-b border-[#27272A] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA] uppercase">Resume Management</h1>
        <p className="text-xs font-mono text-[#A1A1AA] mt-1">
          Upload active candidate documents for automated JD requirement matching
        </p>
      </div>

      {/* Upload zone */}
      <div
        className={`relative border border-dashed rounded-[2px] p-12 text-center transition-colors cursor-pointer bg-[#111114] ${
          dragOver
            ? "border-[#FAFAFA] bg-[#18181B]"
            : "border-[#27272A] hover:border-[#3F3F46]"
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
            <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 2 }} />
            <p className="text-xs font-mono text-[#A1A1AA]">Parsing resume structure and skills...</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 border border-[#27272A] bg-[#18181B] flex items-center justify-center mx-auto mb-3 text-[#FAFAFA]">
              <Upload size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#FAFAFA] uppercase tracking-wide mb-1">
              Drop Resume Document Here
            </h3>
            <p className="text-xs font-mono text-[#71717A] mb-4">
              Supported Formats: PDF, TXT : Maximum Size: 5MB
            </p>
            <button
              className="btn-primary text-xs px-4 py-2"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              Select File
            </button>
            <p className="text-[11px] font-mono text-[#71717A] mt-4">
              Note: PDF files are extracted locally and parsed for technical competencies.
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="p-3 border border-[#EF4444]/30 bg-[#EF4444]/10 text-xs font-mono text-[#F87171] flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{uploadError}</span>
        </div>
      )}
      {uploadSuccess && (
        <div className="p-3 border border-[#10B981]/30 bg-[#10B981]/10 text-xs font-mono text-[#34D399] flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Active resume */}
      {activeResume && (
        <div className="border border-[#27272A] bg-[#111114] p-5">
          <div className="flex items-start justify-between mb-4 border-b border-[#27272A] pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] block mb-1">
                Active Benchmark Resume
              </span>
              <h2 className="text-sm font-bold text-[#FAFAFA]">{activeResume.filename}</h2>
              <p className="text-[11px] font-mono text-[#71717A] mt-0.5">
                Uploaded: {new Date(activeResume.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="badge badge-success text-[10px]">
              Active Benchmark
            </span>
          </div>

          <div>
            <h3 className="text-xs font-mono uppercase text-[#A1A1AA] mb-2">
              Detected Skills ({activeResume.parsedSkills.length})
            </h3>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {activeResume.parsedSkills.map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-[#18181B] border border-[#27272A] text-[11px] font-mono text-[#FAFAFA]"
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
        <div className="border border-[#27272A] bg-[#111114] p-5">
          <h3 className="text-xs font-mono uppercase text-[#A1A1AA] mb-3">
            Document Archive
          </h3>
          <div className="space-y-2">
            {resumes.filter((r) => r.id !== activeResume?.id).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-[#18181B] border border-[#27272A]"
              >
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#A1A1AA]" />
                  <div>
                    <p className="text-xs font-semibold text-[#FAFAFA]">{r.filename}</p>
                    <p className="text-[11px] font-mono text-[#71717A]">
                      {new Date(r.createdAt).toLocaleDateString()} : {r.parsedSkills.length} skills indexed
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
        <div className="border border-[#27272A] bg-[#111114] text-center py-8 p-6">
          <p className="text-xs font-mono text-[#A1A1AA]">
            No resume uploaded yet. Upload a candidate document to initialize qualification matching.
          </p>
        </div>
      )}

      {/* How it works */}
      <div className="border border-[#27272A] bg-[#111114] p-5">
        <h2 className="text-xs font-mono uppercase tracking-wider text-[#A1A1AA] mb-4 flex items-center gap-2">
          <Cpu size={14} className="text-[#FAFAFA]" />
          Requirement Comparison Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Document Ingestion", desc: "Extract candidate competencies, technical skills, and experience keywords." },
            { step: "02", title: "Job Spec Extraction", desc: "Parse raw job postings into structured skill requirements and salary benchmarks." },
            { step: "03", title: "Gap Calculation", desc: "Compute match percentage and highlight qualification discrepancies directly on the card." },
          ].map((item) => (
            <div key={item.step} className="p-4 bg-[#18181B] border border-[#27272A]">
              <div className="text-xs font-mono font-bold text-[#FAFAFA] mb-2 border-b border-[#27272A] pb-1">
                STAGE {item.step}
              </div>
              <p className="text-xs font-bold uppercase text-[#FAFAFA] mb-1">{item.title}</p>
              <p className="text-[11px] font-mono text-[#71717A] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
