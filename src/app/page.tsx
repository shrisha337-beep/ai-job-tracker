import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";
import { Layers, BarChart2, ArrowRight, Cpu } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)]/80 backdrop-blur-sm border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <JTLogo size={24} />
            <span className="font-semibold text-sm text-[var(--color-foreground)]">
              Job Tracker
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors hidden sm:block"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors hidden sm:block"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="btn-primary text-xs px-4 py-1.5"
              id="nav-login-btn"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-full text-xs text-[var(--color-muted-foreground)] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            Open Source · Free to Use
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-foreground)] leading-[1.1] mb-5">
            Track your job search
            <br />
            with clarity.
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-muted-foreground)] max-w-xl mx-auto mb-10 leading-relaxed">
            A simple pipeline to organize applications, parse job descriptions with AI, and see how your resume matches — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="btn-primary w-full sm:w-auto px-7 py-2.5 flex items-center justify-center gap-2 text-sm"
              id="hero-cta-btn"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary w-full sm:w-auto px-7 py-2.5 text-sm text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">
              What you get
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center mb-4 text-[var(--color-primary)]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1.5">
                Visual Pipeline
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                Track applications across stages with an interactive drag-and-drop Kanban board.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-info-muted)] flex items-center justify-center mb-4 text-[var(--color-info)]">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1.5">
                Smart JD Parsing
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                AI extracts role, skills, salary, and requirements from any job description.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-warning-muted)] flex items-center justify-center mb-4 text-[var(--color-warning)]">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-1.5">
                Resume Matching
              </h3>
              <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
                See how your resume aligns with job requirements, with a match score and gap analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <JTLogo size={20} />
            <span className="font-semibold text-xs text-[var(--color-foreground)]">
              Job Tracker
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--color-muted-foreground)]">
            <Link href="/privacy" className="hover:text-[var(--color-foreground)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-foreground)] transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-[var(--color-foreground)] transition-colors">
              Sign In
            </Link>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            © 2026 Job Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
