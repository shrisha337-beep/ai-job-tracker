import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";
import {
  FileText,
  Layers,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] antialiased selection:bg-[#27272A] selection:text-[#FAFAFA]">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#09090B] border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JTLogo size={28} />
            <span className="font-bold text-sm tracking-tight uppercase text-[#FAFAFA]">
              Job Tracker
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors hidden sm:block"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs font-mono text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors hidden sm:block"
            >
              Terms
            </Link>
            <Link
              href="/login"
              className="btn-primary text-xs px-4 py-2"
              id="nav-login-btn"
            >
              Access Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 border-b border-[#27272A] bg-grid">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#111114] border border-[#27272A] text-xs font-mono text-[#A1A1AA] mb-8">
            <span className="w-2 h-2 bg-[#10B981]" />
            SYSTEM STATUS : APPLICATION PIPELINE READY
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#FAFAFA] leading-[1.1] mb-6">
            Structured Pipeline for Your Job Search.
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Direct Kanban tracking, automated job description extraction, and resume requirement matching. Built for speed, clarity, and control.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="btn-primary w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 text-sm"
              id="hero-cta-btn"
            >
              Open Application Tracker
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="btn-secondary w-full sm:w-auto px-8 py-3 text-sm text-center"
            >
              Sign In with Email
            </Link>
          </div>
        </div>
      </section>

      {/* Architectural Features Section */}
      <section className="py-16 px-6 border-b border-[#27272A]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 border-b border-[#27272A] pb-6">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
              Functional Utilities for Candidates
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="border border-[#27272A] bg-[#111114] p-6">
              <div className="w-9 h-9 border border-[#27272A] bg-[#18181B] flex items-center justify-center mb-5 text-[#FAFAFA]">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA] mb-2 uppercase tracking-wide">
                Automated JD Extraction
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Extract job role, technical requirements, salary range, and company info directly from raw job posts into structured records.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-[#27272A] bg-[#111114] p-6">
              <div className="w-9 h-9 border border-[#27272A] bg-[#18181B] flex items-center justify-center mb-5 text-[#FAFAFA]">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA] mb-2 uppercase tracking-wide">
                Resume Gap Evaluation
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Parse your uploaded PDF resume against application criteria to calculate qualification alignment and highlight missing competencies.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-[#27272A] bg-[#111114] p-6">
              <div className="w-9 h-9 border border-[#27272A] bg-[#18181B] flex items-center justify-center mb-5 text-[#FAFAFA]">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA] mb-2 uppercase tracking-wide">
                Structured Kanban Flow
              </h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                Organize every submission across five distinct stages: Bookmarked, Applied, Screening, Interview, and Offer with stage history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Preview Section */}
      <section className="py-16 px-6 border-b border-[#27272A] bg-[#09090B]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#27272A] pb-6">
            <div>
              <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-1">
                Visual Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                Stage Pipeline Layout
              </h2>
            </div>
            <span className="text-xs font-mono text-[#71717A]">
              Interactive Five-Stage Architecture
            </span>
          </div>

          <div className="border border-[#27272A] bg-[#111114] p-6 overflow-x-auto">
            <div className="flex gap-4 min-w-[780px]">
              {[
                { stage: "BOOKMARKED", count: 3, border: "#71717A", role: "Systems Engineer", comp: "CloudScale Inc" },
                { stage: "APPLIED", count: 8, border: "#3B82F6", role: "Backend Developer", comp: "Stripe Platform" },
                { stage: "SCREENING", count: 2, border: "#06B6D4", role: "Platform Architect", comp: "Datadog" },
                { stage: "INTERVIEW", count: 1, border: "#F59E0B", role: "Full Stack Engineer", comp: "Vercel Labs" },
                { stage: "OFFER", count: 1, border: "#10B981", role: "Staff Infrastructure", comp: "GitHub Core" },
              ].map((col, idx) => (
                <div key={idx} className="flex-1 min-w-[140px]">
                  <div
                    className="flex items-center justify-between pb-2 mb-3 border-b"
                    style={{ borderColor: col.border }}
                  >
                    <span className="text-xs font-mono font-bold tracking-wider text-[#A1A1AA]">
                      {col.stage}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#18181B] border border-[#27272A] text-[#FAFAFA]">
                      {col.count}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 border border-[#27272A] bg-[#09090B]">
                      <div className="text-xs font-semibold text-[#FAFAFA]">{col.role}</div>
                      <div className="text-[11px] text-[#A1A1AA] mt-1">{col.comp}</div>
                      <div className="mt-2.5 pt-2 border-t border-[#18181B] flex items-center justify-between text-[10px] font-mono text-[#71717A]">
                        <span>Match: 92%</span>
                        <span>Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Action Banner */}
      <section className="py-16 px-6 border-b border-[#27272A]">
        <div className="max-w-4xl mx-auto border border-[#27272A] bg-[#111114] p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA] mb-3">
            Start Tracking Applications
          </h2>
          <p className="text-sm text-[#A1A1AA] max-w-xl mx-auto mb-8">
            Create an account to begin tracking roles, parsing job specifications, and monitoring your application stages.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm"
            id="cta-btn"
          >
            Launch Tracker
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-[#09090B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <JTLogo size={24} />
            <span className="font-bold text-xs tracking-wider uppercase text-[#FAFAFA]">
              Job Tracker
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono text-[#A1A1AA]">
            <Link href="/privacy" className="hover:text-[#FAFAFA] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#FAFAFA] transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-[#FAFAFA] transition-colors">
              Sign In
            </Link>
          </div>
          <div className="text-xs font-mono text-[#71717A]">
            © 2026 Job Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
