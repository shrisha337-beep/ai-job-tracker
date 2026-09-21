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
      <div className="min-h-screen flex items-center justify-center bg-[#09090B]">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B] p-4 text-[#FAFAFA]">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <JTLogo size={44} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA] mb-2 uppercase">
            Job Tracker
          </h1>
          <p className="text-[#A1A1AA] text-xs font-mono">
            Pipeline Access : Authenticate to Continue
          </p>
        </div>

        {/* Login Card */}
        <div className="border border-[#27272A] bg-[#111114] p-8">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors bg-[#18181B] text-[#FAFAFA] border border-[#27272A] hover:bg-[#27272A] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
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
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#27272A]" />
            <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-widest">
              Or Email Login
            </span>
            <div className="flex-1 h-px bg-[#27272A]" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-mono text-[#A1A1AA] uppercase mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field w-full"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider"
              id="email-login-btn"
            >
              {isLoading ? (
                <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                "Authenticate with Email"
              )}
            </button>
          </form>

          <p className="text-[11px] font-mono text-[#71717A] text-center mt-6">
            Direct credential sign in. No password required for initial workspace setup.
          </p>
        </div>

        {/* Footer Navigation & Legal */}
        <div className="flex items-center justify-between mt-6 text-xs font-mono text-[#71717A]">
          <Link href="/" className="hover:text-[#FAFAFA] transition-colors">
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#FAFAFA] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#FAFAFA] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
