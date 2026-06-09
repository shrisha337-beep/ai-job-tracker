"use client";

import AppLayout from "@/components/layout/AppLayout";
import { SessionProvider } from "next-auth/react";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AppLayout>{children}</AppLayout>
    </SessionProvider>
  );
}
