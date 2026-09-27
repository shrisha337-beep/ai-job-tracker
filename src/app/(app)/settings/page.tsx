"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { 
  User, 
  CreditCard, 
  Key, 
  Bell, 
  Sparkles, 
  CheckCircle, 
  Check 
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [successMsg, setSuccessMsg] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings states
  const [displayName, setDisplayName] = useState(session?.user?.name || "");
  const [customKey, setCustomKey] = useState("");
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("Profile updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleSaveApiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("API configurations saved!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleUpgrade = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowUpgradeModal(true);
    }, 600);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">Settings</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Manage your account profile, preferences, and API configuration
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Navigation Links / Anchors */}
        <div className="space-y-3 md:col-span-1">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "billing", label: "Plan & Usage", icon: CreditCard },
            { id: "api", label: "API Configuration", icon: Key },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] hover:bg-[var(--color-surface-2)] text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors border border-transparent hover:border-[var(--color-border)] font-medium"
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </a>
          ))}

          {/* Usage Stats sidebar */}
          <div className="card mt-6 space-y-3 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-4">
            <h4 className="text-xs font-semibold text-[var(--color-foreground)] uppercase tracking-wider">Usage Stats</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Job description parses</span>
                <span className="font-semibold text-[var(--color-foreground)]">4 / 10</span>
              </div>
              <div className="w-full bg-[var(--color-surface-2)] h-2 rounded-[3px] overflow-hidden border border-[var(--color-border)]">
                <div className="bg-[var(--color-primary)] h-full w-[40%] rounded-[3px]" />
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[var(--color-muted-foreground)]">Resumes uploaded</span>
                <span className="font-semibold text-[var(--color-foreground)]">1 / 3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Configuration Cards */}
        <div className="space-y-6 md:col-span-2">
          
          {/* Profile Section */}
          <div id="profile" className="card space-y-4 scroll-mt-6 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-xs">
            <h3 className="text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <User className="w-4 h-4 text-[var(--color-primary)]" />
              Profile Information
            </h3>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="field-group col-span-2 sm:col-span-1">
                  <label className="label">Display Name</label>
                  <input
                    type="text"
                    className="input text-xs"
                    placeholder="Your Name"
                    value={displayName || session?.user?.name || ""}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                
                <div className="field-group col-span-2 sm:col-span-1">
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    className="input text-xs opacity-60 cursor-not-allowed"
                    value={session?.user?.email || "you@example.com"}
                    disabled
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt="Profile Avatar"
                    className="w-10 h-10 rounded-[6px] border border-[var(--color-border)]"
                  />
                )}
                <div>
                  <p className="text-xs font-semibold text-[var(--color-foreground)]">Connected Account</p>
                  <p className="text-[11px] text-[var(--color-muted-foreground)]">Profile photo synced via authenticated provider</p>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary text-xs py-2 px-4 h-auto">
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Billing / Plans Section */}
          <div id="billing" className="card space-y-4 scroll-mt-6 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-xs">
            <h3 className="text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
              Plans & Billing
            </h3>

            <div className="p-4 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)] flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--color-foreground)]">Standard Tier</span>
                  <span className="badge badge-primary text-[9px] uppercase px-1.5 font-bold">Active</span>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                  Track up to 50 applications, 10 job description parses, and 3 resume evaluation cycles per month.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[var(--color-foreground)]">$0</span>
                <span className="text-xs text-[var(--color-muted-foreground)] font-medium"> / month</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 gap-4">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Upgrade to unlock unlimited application tracking and resume comparison.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={isSubmitting}
                className="btn-primary text-xs py-2 px-4 h-auto shrink-0 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSubmitting ? "Processing..." : "Upgrade to Pro"}
              </button>
            </div>
          </div>

          {/* API Keys Configuration */}
          <div id="api" className="card space-y-4 scroll-mt-6 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-xs">
            <h3 className="text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <Key className="w-4 h-4 text-amber-500" />
              API Settings
            </h3>
            
            <form onSubmit={handleSaveApiSettings} className="space-y-4">
              <div className="flex items-start gap-3 p-3.5 rounded-[6px] bg-[var(--color-surface-0)] border border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[var(--color-foreground)]">API Key Pre-configured:</span> A default OpenAI key is configured in the environment for requirement extraction and parsing.
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="useCustomKey"
                  checked={useCustomKey}
                  onChange={(e) => setUseCustomKey(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="useCustomKey" className="text-xs font-medium text-[var(--color-foreground)] cursor-pointer">
                  Use custom OpenAI API Key (overrides default)
                </label>
              </div>

              {useCustomKey && (
                <div className="field-group">
                  <label className="label">OpenAI API Key</label>
                  <input
                    type="password"
                    className="input text-xs"
                    placeholder="sk-proj-..."
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                  <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1.5">
                    Your key is stored securely in your local environment. We do not store keys in our databases.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" className="btn-primary text-xs py-2 px-4 h-auto">
                  Save API Settings
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Card */}
          <div id="notifications" className="card space-y-4 scroll-mt-6 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-[6px] p-5 shadow-xs">
            <h3 className="text-base font-semibold text-[var(--color-foreground)] flex items-center gap-2 border-b border-[var(--color-border)] pb-3">
              <Bell className="w-4 h-4 text-[var(--color-foreground)]" />
              Notifications
            </h3>

            <div className="space-y-4 pt-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-foreground)]">Email Follow-ups</label>
                  <p className="text-[11px] text-[var(--color-muted-foreground)] leading-relaxed">
                    Receive email alerts when job application interview dates are approaching.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--color-foreground)]">Weekly Job Digest</label>
                  <p className="text-[11px] text-[var(--color-muted-foreground)] leading-relaxed">
                    Get a weekly dashboard summary showing response rates, upcoming schedules, and resume fits.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Upgrade Mock Success Modal */}
      {showUpgradeModal && (
        <>
          <div className="overlay z-[90]" onClick={() => setShowUpgradeModal(false)} />
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="dialog w-full max-w-md p-6 text-center space-y-5 rounded-[8px]">
              <div className="w-12 h-12 rounded-[6px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto text-xl">
                <Check className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-[var(--color-foreground)]">Upgraded to Pro</h2>
                <p className="text-xs text-[var(--color-muted-foreground)] leading-relaxed">
                  Welcome to <strong>Job Tracker Pro</strong>. You now have unlimited job description parsing, active resume match scores, and automated stage tracking.
                </p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="btn-primary w-full text-xs py-2"
              >
                Continue to Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
