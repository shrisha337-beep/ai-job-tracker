"use client"

import Link from "next/link"
import { MoireField } from "@/components/ui/moire-field"
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react"

export function MoireFieldDemo() {
  return (
    <MoireField
      className="flex min-h-[max(600px,100vh)] w-full items-center justify-center px-5 py-20 sm:px-8"
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
            "radial-gradient(ellipse 60% 40% at 50% 50%, var(--color-background) 0%, var(--color-background) 40%, color-mix(in oklab, var(--color-background) 60%, transparent) 75%, transparent 100%)",
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

      <section data-hero-content className="relative flex w-full max-w-3xl flex-col items-center text-center z-10">
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
          Replace chaotic spreadsheets with a visual Kanban pipeline, AI job description parsing, and automated resume-to-JD match scoring.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
            href="/login"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background/70 px-6 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent"
          >
            Explore Features
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
  )
}

export default MoireFieldDemo
