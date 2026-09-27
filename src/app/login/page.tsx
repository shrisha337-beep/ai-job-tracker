"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { JTLogo } from "@/components/layout/JTLogo";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await signIn("credentials", {
        email,
        callbackUrl: "/dashboard",
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-surface-0)] p-4 text-[var(--color-foreground)]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <JTLogo size={36} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-foreground)] mb-1">
            Sign in to Job Tracker
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Welcome back — let&apos;s pick up where you left off.
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-6">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-1)] disabled:opacity-50 disabled:cursor-not-allowed mb-5"
            id="google-login-btn"
          >
            {isGoogleLoading ? (
              <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-muted)]">
              or
            </span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full py-2.5 text-sm"
              id="email-login-btn"
            >
              {isLoading ? (
                <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                "Sign in with Email"
              )}
            </button>
          </form>

          <p className="text-xs text-[var(--color-muted)] text-center mt-5">
            No password required. New accounts are created automatically.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-5 text-xs text-[var(--color-muted)]">
          <Link href="/" className="hover:text-[var(--color-foreground)] transition-colors">
            ← Back to home
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--color-foreground)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-foreground)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
