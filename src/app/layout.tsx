import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobtracker.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Job Tracker — Track your job search with clarity",
  description:
    "Visual kanban pipeline for job applications, AI-powered job description parsing, and resume match scoring. Free and open source.",
  keywords: [
    "job tracker",
    "application tracker",
    "resume matcher",
    "kanban pipeline",
    "job application management",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Job Tracker — Track your job search with clarity",
    description:
      "Visual kanban pipeline for job applications, AI-powered job description parsing, and resume match scoring.",
    url: siteUrl,
    siteName: "Job Tracker",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "Job Tracker",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script to prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme');
                if (t === 'dark') document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
