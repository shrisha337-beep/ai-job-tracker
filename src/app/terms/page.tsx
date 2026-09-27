import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata = {
  title: "Terms of Service | Job Tracker",
  description: "Terms and conditions of use for Job Tracker.",
};

export default function TermsPage() {
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
              Legal & Terms
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
              Terms of Service
            </h1>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              Last Updated: March 2026 · Effective Immediately
            </p>
          </div>

          <div className="space-y-8 text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using Job Tracker (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                2. Description of Service
              </h2>
              <p>
                Job Tracker provides an organizational tool for managing job applications, structured Kanban board tracking, resume text extraction, and automated requirement comparison. The Service is provided for informational and personal workflow management purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                3. User Account and Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate, current information and not to use the Service for any unlawful or unauthorized purpose.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                4. User Content & Data Ownership
              </h2>
              <p>
                You retain all rights and ownership to the data you upload or enter into the platform, including resumes, notes, and application records. By submitting content, you grant Job Tracker a limited license solely to process and display that data within your account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                5. Disclaimer: No Guarantee of Outcomes
              </h2>
              <p>
                Job Tracker is a productivity platform. We do not guarantee employment, job interviews, offers, or specific hiring outcomes. Resume match scores and parsed requirements are algorithmic approximations intended for self-review and should not be considered definitive hiring evaluations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Job Tracker and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, the Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                7. Modifications to the Service
              </h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any feature of the Service at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[var(--color-foreground)] mb-3">
                8. Contact Information
              </h2>
              <p>
                For questions regarding these Terms of Service, contact:
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
            <Link href="/privacy" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline underline-offset-4">
              Privacy Policy
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
