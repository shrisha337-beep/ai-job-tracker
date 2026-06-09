export default function ResumePage() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Resume</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Upload your resume to get AI-powered match scores
        </p>
      </div>

      {/* Upload area */}
      <div className="glass rounded-2xl p-12 text-center border-2 border-dashed border-[var(--border-secondary)] hover:border-[var(--color-primary)] transition-colors cursor-pointer">
        <div className="text-5xl mb-4">📄</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Upload Your Resume
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          Drag and drop your PDF resume here, or click to browse.
          AI will extract your skills and experience for matching.
        </p>
        <button className="btn-primary">Choose PDF File</button>
      </div>
    </div>
  );
}
