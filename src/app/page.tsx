import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 15 2 2 4-4" />
                <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              </svg>
            </div>
            <span className="font-bold text-lg">JobTracker AI</span>
          </div>
          <Link href="/login" className="btn-primary text-sm px-5 py-2" id="nav-login-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-20 left-1/3 w-[600px] h-[600px] rounded-full opacity-15 blur-[120px]"
            style={{ background: "var(--color-primary)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
            style={{ background: "var(--color-accent)" }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-6 animate-[fadeIn_0.5s_ease-out]"
            style={{
              background: "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              color: "var(--color-primary-light)",
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI-Powered Job Tracking
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-[fadeIn_0.6s_ease-out]">
            Track Applications.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Land Interviews.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-[fadeIn_0.7s_ease-out]">
            Paste any job description — AI extracts the details, scores your resume match,
            and tracks your pipeline from applied to offer.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeIn_0.8s_ease-out]">
            <Link
              href="/login"
              className="btn-primary text-base px-8 py-3.5 flex items-center gap-2"
              id="hero-cta-btn"
            >
              Start Tracking Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <span className="text-sm text-[var(--text-muted)]">
              No credit card required
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span style={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                land the job
              </span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
              Stop juggling spreadsheets. Let AI handle the heavy lifting while you focus on preparing for interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                ),
                title: "AI JD Parser",
                desc: "Paste a job URL or description — AI extracts role, skills, salary, location into structured data instantly.",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ),
                title: "Resume Match Score",
                desc: "Upload your resume once — get an AI-powered match score with gap analysis for every application.",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M8 7v7" />
                    <path d="M12 7v4" />
                    <path d="M16 7v10" />
                  </svg>
                ),
                title: "Insights Dashboard",
                desc: "Response rates, skill demand trends, application timeline — data-driven job search strategy.",
                gradient: "from-violet-500 to-purple-600",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${feature.gradient}`}
                  style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
                >
                  <span className="text-white">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kanban Preview */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Visual Pipeline</h2>
            <p className="text-[var(--text-secondary)]">
              Drag-and-drop Kanban board to track every application stage
            </p>
          </div>

          <div className="glass rounded-2xl p-6 overflow-x-auto">
            <div className="flex gap-4 min-w-[800px]">
              {[
                { status: "Bookmarked", count: 3, color: "var(--status-bookmarked)" },
                { status: "Applied", count: 8, color: "var(--status-applied)" },
                { status: "Screening", count: 2, color: "var(--status-screening)" },
                { status: "Interview", count: 1, color: "var(--status-interview)" },
                { status: "Offer", count: 1, color: "var(--status-offer)" },
              ].map((col, i) => (
                <div key={i} className="flex-1 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{col.status}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {col.count}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: Math.min(col.count, 2) }).map((_, j) => (
                      <div
                        key={j}
                        className="rounded-xl p-3 border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                      >
                        <div className="h-2.5 w-3/4 rounded bg-[var(--bg-tertiary)] mb-2" />
                        <div className="h-2 w-1/2 rounded bg-[var(--bg-tertiary)]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-[120px]"
            style={{ background: "var(--color-primary)" }}
          />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to supercharge your job search?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Join thousands of job seekers who track smarter, not harder.
          </p>
          <Link href="/login" className="btn-primary text-base px-8 py-3.5 inline-flex items-center gap-2" id="cta-btn">
            Get Started — It&apos;s Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>
            <span className="text-sm font-medium">JobTracker AI</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            © 2025 JobTracker AI. Built with Next.js, PostgreSQL & OpenAI.
          </p>
        </div>
      </footer>
    </div>
  );
}
