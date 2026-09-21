import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";

export const metadata = {
  title: "Terms of Service | Job Tracker",
  description: "Terms and conditions of use for Job Tracker.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      {/* Top Header */}
      <header className="border-b border-[#27272A] bg-[#09090B]/90 sticky top-0 z-40 backdrop-blur-none">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JTLogo size={28} />
            <span className="font-bold text-sm tracking-tight uppercase">Job Tracker</span>
          </Link>
          <Link
            href="/login"
            className="btn-secondary text-xs px-3.5 py-1.5"
          >
            Access Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="border border-[#27272A] bg-[#111114] p-8 md:p-12">
          <div className="border-b border-[#27272A] pb-6 mb-8">
            <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider block mb-2">
              Legal Documentation: Terms and Conditions
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">
              Terms of Service
            </h1>
            <p className="text-xs font-mono text-[#71717A] mt-2">
              Last Updated: March 2026 : Effective Immediately
            </p>
          </div>

          <div className="space-y-8 text-sm text-[#A1A1AA] leading-relaxed">
            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, accessing, or using Job Tracker (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                2. Description of Service
              </h2>
              <p>
                Job Tracker provides an organizational tool for managing job applications, structured Kanban board tracking, resume text extraction, and automated requirement comparison. The Service is provided for informational and personal workflow management purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                3. User Account and Responsibilities
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to provide accurate, current information and not to use the Service for any unlawful or unauthorized purpose.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                4. User Content & Data Ownership
              </h2>
              <p>
                You retain all rights and ownership to the data you upload or enter into the platform, including resumes, notes, and application records. By submitting content, you grant Job Tracker a limited license solely to process and display that data within your account.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                5. Disclaimer: No Guarantee of Outcomes
              </h2>
              <p>
                Job Tracker is a productivity platform. We do not guarantee employment, job interviews, offers, or specific hiring outcomes. Resume match scores and parsed requirements are algorithmic approximations intended for self-review and should not be considered definitive hiring evaluations.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Job Tracker and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of, or inability to use, the Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                7. Modifications to the Service
              </h2>
              <p>
                We reserve the right to modify, suspend, or discontinue any feature of the Service at any time with or without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-[#FAFAFA] mb-3 uppercase tracking-wide">
                8. Contact Information
              </h2>
              <p>
                For questions regarding these Terms of Service, please contact:
              </p>
              <div className="mt-3 p-4 border border-[#27272A] bg-[#09090B]">
                <p className="text-[#FAFAFA] font-mono text-xs">Entity: Job Tracker</p>
                <p className="text-[#FAFAFA] font-mono text-xs mt-1">
                  Inquiries: support@jobtracker.com
                </p>
              </div>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-[#27272A] flex items-center justify-between text-xs text-[#71717A]">
            <span>© 2026 Job Tracker. All rights reserved.</span>
            <Link href="/privacy" className="text-[#A1A1AA] hover:text-[#FAFAFA] underline underline-offset-4">
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
