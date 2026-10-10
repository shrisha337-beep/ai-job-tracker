import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { MoireField } from "@/components/ui/moire-field";
import {
  Sparkles,
  ArrowRight,
  Kanban,
  FileText,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased transition-theme">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <JTLogo size={24} />
            <span className="font-semibold text-sm text-foreground">
              Job Tracker
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Terms
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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

      {/* Hero Section with MoireField */}
      <MoireField
        className="flex min-h-[max(640px,100vh)] w-full items-center justify-center px-5 pt-32 pb-20 sm:px-8 sm:pt-36 sm:pb-24 border-b border-border"
        detune={3.6}
        drift={0.55}
        duty={0.18}
        fade={0.45}
        intensity={0.35}
        pitch={18}
      >
        {/* Backdrop radial vignette to keep text legible */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 65% 45% at 50% 50%, var(--color-background) 0%, var(--color-background) 40%, color-mix(in oklab, var(--color-background) 60%, transparent) 75%, transparent 100%)",
          }}
        />

        {/* Entrance Animation Keyframes */}
        <style>{`
          @keyframes hero-rise {
            from { opacity: 0; transform: translateY(14px); filter: blur(6px); }
            to   { opacity: 1; transform: none;              filter: blur(0); }
          }
          [data-hero-content] > * { animation: hero-rise .58s cubic-bezier(.22,1,.36,1) both; }
          [data-hero-content] > :nth-child(2) { animation-delay: 70ms; }
          [data-hero-content] > :nth-child(3) { animation-delay: 140ms; }
          [data-hero-content] > :nth-child(4) { animation-delay: 210ms; }
          [data-hero-content] > :nth-child(5) { animation-delay: 280ms; }
          @media (prefers-reduced-motion: reduce) {
            [data-hero-content] > * { animation: none; }
          }
        `}</style>

        <section
          data-hero-content
          className="relative flex w-full max-w-3xl flex-col items-center text-center z-10"
        >
          {/* Eyebrow Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span>AI-Powered Career Command Center</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
            Organize your job search. <br className="hidden sm:inline" />
            <span className="text-primary">Land your dream role.</span>
          </h1>

          {/* Subline */}
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg text-pretty">
            Replace chaotic spreadsheets with a visual Kanban pipeline, AI job description parsing, and automated resume match scoring.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              id="hero-cta-btn"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
              href="/login"
            >
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background/70 px-6 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-surface-1"
            >
              See How It Works
            </a>
          </div>

          {/* Feature highlights pill */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" /> 6-Stage Kanban Board
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" /> GPT-4o-mini JD Parsing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" /> ATS Match Scoring
            </span>
          </div>
        </section>
      </MoireField>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              What you get
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Everything you need, nothing you don&apos;t
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-muted)] flex items-center justify-center mb-4 text-primary">
                <Kanban className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Visual Kanban Pipeline
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Track applications across 6 stages with smooth drag-and-drop state transitions and real-time counts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-info-muted)] flex items-center justify-center mb-4 text-info">
                <Cpu className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Smart JD Parsing
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI extracts role, seniority, skills, salary range, and company requirements in seconds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-surface p-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--color-warning-muted)] flex items-center justify-center mb-4 text-warning">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Resume Match & ATS Scoring
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload your resume to see automated skill overlap, gap analysis, and ATS-tailored recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <JTLogo size={20} />
            <span className="font-semibold text-xs text-foreground">
              Job Tracker
            </span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>
          <div className="text-xs text-muted">
            &copy; 2026 Job Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
