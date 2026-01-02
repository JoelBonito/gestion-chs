/**
 * INOVE AI Design System - Main App Layout
 * Layout with Fixed Sidebar and Floating TopBar
 * Updated: Phase 5 Fix
 */
import { useState } from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { FloatingTopBar } from "../components/FloatingTopBar";
import { cn } from "../lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  // State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen flex-row overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)] antialiased selection:bg-[var(--primary)]/30">
      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        closeMobile={() => setIsMobileMenuOpen(false)}
        onMobileMenuClick={() => setIsMobileMenuOpen(true)}
        isCollapsed={isCollapsed}
        toggleCollapsed={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Area */}
      <main
        className={cn(
          "relative flex min-h-screen flex-1 flex-col transition-all duration-500 ease-in-out",
          isCollapsed ? "xl:ml-20" : "xl:ml-64"
        )}
      >
        {/* Floating Top Bar with Props */}
        <FloatingTopBar
          onMobileMenuClick={() => setIsMobileMenuOpen(true)}
          isSidebarCollapsed={isCollapsed}
        />

        {/* Fixed Overlay for Mobile when menu is open */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm xl:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Page Content area starts below the TopBar */}
        <div className="relative w-full flex-1 overflow-x-hidden px-4 pt-[72px] sm:px-6 lg:px-8">
          <div className="animate-fade-in mx-auto h-full w-full max-w-7xl pb-10">{children}</div>
        </div>
      </main>
    </div>
  );
};
