export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Display Name
              </label>
              <input type="text" className="input-field w-full max-w-md" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input type="email" className="input-field w-full max-w-md" placeholder="you@example.com" disabled />
            </div>
          </div>
        </div>

        <hr className="border-[var(--border-primary)]" />

        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Plan</h3>
          <div className="flex items-center gap-4">
            <span className="badge badge-primary">Free Plan</span>
            <span className="text-sm text-[var(--text-secondary)]">10 AI parses/month</span>
          </div>
          <button className="btn-secondary mt-4">Upgrade to Pro</button>
        </div>
      </div>
    </div>
  );
}
