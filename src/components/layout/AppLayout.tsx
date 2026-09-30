"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { LayoutDashboard, Kanban, FileText, Settings, LogOut, Menu, ChevronLeft } from "lucide-react";
import { JTLogo } from "./JTLogo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Applications",
    href: "/applications",
    icon: <Kanban size={18} />,
  },
  {
    label: "Resume",
    href: "/resume",
    icon: <FileText size={18} />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings size={18} />,
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] flex transition-theme">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-1)] transition-all duration-200 ${
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div
          className={`h-16 flex items-center border-b border-[var(--color-border)] transition-all ${
            sidebarCollapsed ? "justify-center px-2" : "gap-3 px-4"
          }`}
        >
          <JTLogo size={26} />
          {!sidebarCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs tracking-wider uppercase text-[var(--color-foreground)] whitespace-nowrap">
                Job Tracker
              </span>
              <span className="text-[10px] font-mono text-[var(--color-muted-foreground)] leading-none mt-0.5">
                AI Platform
              </span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 py-2 text-[13px] font-medium transition-all duration-150 rounded-[6px] ${
                  sidebarCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "px-3"
                } ${
                  isActive
                    ? "bg-[var(--color-surface-2)] text-[var(--color-foreground)] shadow-xs"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]/70"
                }`}
                id={`nav-${item.label.toLowerCase()}`}
              >
                {isActive && (
                  <span
                    className={`absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--color-primary)] ${
                      sidebarCollapsed ? "hidden" : "block"
                    }`}
                  />
                )}
                <span
                  className={`shrink-0 transition-colors ${
                    isActive ? "text-[var(--color-primary)]" : "text-[var(--color-muted-foreground)]"
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="hidden lg:block px-2 pb-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-border)] rounded-[6px] transition-colors cursor-pointer"
            id="sidebar-collapse-btn"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronLeft
              size={15}
              style={{ transform: sidebarCollapsed ? "rotate(180deg)" : undefined }}
            />
          </button>
        </div>

        {/* User Footer */}
        <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface-0)]">
          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
            <div
              className="w-8 h-8 rounded-[6px] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-xs font-mono font-medium text-[var(--color-foreground)]"
              title={session?.user?.name || session?.user?.email || "User"}
            >
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--color-foreground)] truncate">
                  {session?.user?.name || "Workspace User"}
                </p>
                <p className="text-[10px] font-mono text-[var(--color-muted-foreground)] truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-[6px] text-[var(--color-muted-foreground)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] border border-transparent hover:border-[var(--color-danger-muted)] transition-colors cursor-pointer"
                title="Sign out"
                id="signout-btn"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
      <div
        className={`flex-1 transition-all duration-200 ${
          sidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-[var(--color-background)] border-b border-[var(--color-border)] flex items-center px-4 lg:px-6 transition-theme">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-[6px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] mr-3"
            id="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="badge badge-primary text-[10px] uppercase font-mono">
              Production
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
