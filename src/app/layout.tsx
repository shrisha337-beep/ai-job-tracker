import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "JobTracker AI — AI-Powered Job Application Tracker",
  description:
    "Track job applications, parse JDs with AI, match your resume, and land more interviews. Free and open-source.",
  keywords: [
    "job tracker",
    "application tracker",
    "resume matcher",
    "AI job search",
    "kanban board",
  ],
  openGraph: {
    title: "JobTracker AI — AI-Powered Job Application Tracker",
    description:
      "Track job applications, parse JDs with AI, match your resume, and land more interviews.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    title: "JobTracker AI",
    statusBarStyle: "black-translucent",
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
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
