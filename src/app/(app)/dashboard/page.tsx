export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Overview of your job search pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: "0", icon: "📋", change: "+0 this week" },
          { label: "Interviews", value: "0", icon: "🎯", change: "0% response rate" },
          { label: "Avg Match Score", value: "—", icon: "⚡", change: "Upload resume to start" },
          { label: "Offers", value: "0", icon: "🎉", change: "Keep going!" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{stat.label}</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div className="glass rounded-2xl p-12 text-center">
        <div className="text-5xl mb-4">🚀</div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          Start Tracking Applications
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
          Add your first job application to see your pipeline come to life.
          Paste a job URL and let AI extract all the details.
        </p>
        <a href="/applications" className="btn-primary inline-flex items-center gap-2">
          Go to Applications
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
