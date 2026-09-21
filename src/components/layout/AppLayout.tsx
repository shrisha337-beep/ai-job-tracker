"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Bot, MessageSquare, LayoutDashboard, Kanban, FileText, Settings, LogOut, Menu, ChevronLeft } from "lucide-react";
import ChatSidebar from "../chat/ChatSidebar";
import { JTLogo } from "./JTLogo";

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
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleActionTriggered = (action: any) => {
    console.log("Chat action triggered:", action);
    if (action.type === "MOVE_APPLICATION") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[#27272A] bg-[#111114] transition-all duration-200 ${
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-[#27272A]">
          <JTLogo size={28} />
          {!sidebarCollapsed && (
            <span className="font-bold text-xs tracking-wider uppercase text-[#FAFAFA] whitespace-nowrap">
              Job Tracker
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors rounded-[2px] ${
                  isActive
                    ? "bg-[#18181B] text-[#FAFAFA] border-l-2 border-[#FAFAFA]"
                    : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] border-l-2 border-transparent"
                }`}
                id={`nav-${item.label.toLowerCase()}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="hidden lg:block px-2 pb-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-transparent hover:border-[#27272A] rounded-[2px] transition-colors"
            id="sidebar-collapse-btn"
            title="Toggle Sidebar"
          >
            <ChevronLeft
              size={16}
              style={{ transform: sidebarCollapsed ? "rotate(180deg)" : undefined }}
            />
          </button>
        </div>

        {/* User Footer */}
        <div className="border-t border-[#27272A] p-3 bg-[#09090B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#18181B] border border-[#27272A] flex items-center justify-center shrink-0 text-xs font-mono text-[#FAFAFA]">
              {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#FAFAFA] truncate">
                  {session?.user?.name || "Workspace User"}
                </p>
                <p className="text-[10px] font-mono text-[#71717A] truncate">
                  {session?.user?.email}
                </p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 rounded-[2px] text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-colors"
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
          className="fixed inset-0 bg-black/70 z-30 lg:hidden"
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
        <header className="sticky top-0 z-20 h-16 bg-[#09090B] border-b border-[#27272A] flex items-center px-4 lg:px-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-[2px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] mr-3"
            id="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>

          <div className="flex-1" />

          {/* Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="px-3 py-1.5 rounded-[2px] bg-[#18181B] hover:bg-[#27272A] text-[#FAFAFA] text-xs font-mono transition-colors flex items-center gap-2 border border-[#27272A]"
              title="Assistant"
              id="chat-toggle-header-btn"
            >
              <Bot size={14} />
              <span className="hidden sm:inline uppercase">Assistant</span>
            </button>
            <span className="badge badge-primary text-[10px] uppercase font-mono">
              Production
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>

        {/* Floating Chat Trigger Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-[2px] bg-[#FAFAFA] text-[#09090B] hover:bg-[#E4E4E7] shadow-lg transition-colors flex items-center justify-center border border-[#FAFAFA]"
          id="chat-toggle-btn"
          title="Toggle Chat Assistant"
        >
          <div className="relative flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <MessageSquare size={16} />
            <span className="hidden sm:inline">Assistant</span>
            <span className="w-1.5 h-1.5 rounded-[1px] bg-[#10B981]" />
          </div>
        </button>

        {/* Chatbot Drawer */}
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onActionTriggered={handleActionTriggered}
        />
      </div>
    </div>
  );
}
