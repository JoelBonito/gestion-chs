/**
 * INOVE AI Design System - Main App Layout
 * Layout with Fixed Sidebar and Floating TopBar
 * Updated: Phase 5 Fix
 */
import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { cn } from '../lib/utils';


interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
    // State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans antialiased flex flex-row overflow-hidden selection:bg-[var(--primary)]/30">

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
                    "flex-1 flex flex-col min-h-screen transition-all duration-500 ease-in-out relative",
                    isCollapsed ? 'xl:ml-20' : 'xl:ml-64'
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
                <div className="flex-1 w-full relative pt-[72px] px-4 sm:px-6 lg:px-8 overflow-x-hidden">
                    <div className="animate-fade-in w-full h-full max-w-7xl mx-auto pb-10">
                        {children}
                    </div>
                </div>
            </main>


        </div>
    );
};
