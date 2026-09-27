import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata = {
  title: "Privacy Policy | Job Tracker",
  description: "Privacy policy and data protection practices for Job Tracker.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex flex-col transition-theme">
      {/* Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-0)] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JTLogo size={28} />
            <span className="font-bold text-sm tracking-tight text-[var(--color-foreground)]">Job Tracker</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="btn-primary text-xs px-3.5 py-1.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="border border-[var(--color-border)] bg-[var(--color-surface-1)] rounded-[6px] p-8 md:p-12 shadow-xs">
          <div className="border-b border-[var(--color-border)] pb-6 mb-8">
            <span className="text-xs font-medium text-[var(--color-primary)] uppercase tracking-wider block mb-2">
              Legal & Privacy
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
              Privacy Policy
            </h1>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              Last Updated: March 2026 · Effective Immediately
            </p>
          </div>

          <div className="space-y-8 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                1. Overview
              </h2>
              <p>
                Job Tracker (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how information is collected, used, and safeguarded when you use our job application tracking platform, resume matching utilities, and related services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                2. Information We Collect
              </h2>
              <p className="mb-3">
                We collect only information necessary to operate your application pipeline:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>
                  <strong className="text-[var(--color-foreground)]">Account Credentials:</strong> Email address and profile authentication identifiers provided via email login or Google OAuth.
                </li>
                <li>
                  <strong className="text-[var(--color-foreground)]">Application Records:</strong> Job titles, company names, job descriptions, salary estimates, application stages, dates, and custom notes entered or imported into your pipeline.
                </li>
                <li>
                  <strong className="text-[var(--color-foreground)]">Resume Documents:</strong> Resume files (PDF or plain text) uploaded for automated skill matching and gap evaluation.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                3. How We Use Your Data
              </h2>
              <p className="mb-3">
                Your data is processed strictly for functional product operations:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-2">
                <li>Maintaining and rendering your Kanban application pipeline.</li>
                <li>Parsing raw job descriptions to extract structured role attributes.</li>
                <li>Comparing your resume against job requirements to compute match percentages and skill gaps.</li>
                <li>Authenticating user sessions and securing account access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                4. Third-Party Processing & AI Services
              </h2>
              <p>
                When you choose to parse a job description or run a resume comparison, relevant text extracts are processed via secure API endpoints (such as OpenAI API) solely to generate structured extraction output. Your personal documents are not sold to data brokers or used to train public models.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                5. Data Storage and Security
              </h2>
              <p>
                All account records and pipeline details are stored in protected PostgreSQL databases with encrypted transmission (TLS/HTTPS). Session tokens are managed securely through standard HTTP-only session cookies.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                6. Data Retention & Deletion
              </h2>
              <p>
                You retain full ownership of your data. You may delete individual applications, remove uploaded resumes, or request complete account deletion at any time by contacting our support team.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                7. Contact Information
              </h2>
              <p>
                For questions regarding this Privacy Policy or to submit data deletion requests, contact:
              </p>
              <div className="mt-3 p-4 border border-[var(--color-border)] bg-[var(--color-surface-0)] rounded-[6px]">
                <p className="text-[var(--color-foreground)] font-mono text-xs">Entity: Job Tracker</p>
                <p className="text-[var(--color-foreground)] font-mono text-xs mt-1">
                  Inquiries: support@jobtracker.com
                </p>
              </div>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span>© 2026 Job Tracker. All rights reserved.</span>
            <Link href="/terms" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline underline-offset-4">
              Terms of Service
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 px-6 bg-[var(--color-surface-0)] text-xs text-[var(--color-muted-foreground)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <JTLogo size={20} />
            <span className="font-semibold text-[var(--color-foreground)]">Job Tracker</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[var(--color-foreground)] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--color-foreground)] transition-colors">Terms</Link>
            <Link href="/login" className="hover:text-[var(--color-foreground)] transition-colors">Sign In</Link>
          </div>
          <div>
            © 2026 Job Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
