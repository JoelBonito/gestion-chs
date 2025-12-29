/**
 * INOVE AI Design System - Main Sidebar
 * Adapted for Gestion CHS
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, // Dashboard
    Package,         // Produtos
    Users,           // Clientes
    Truck,           // Fornecedores
    ClipboardList,   // Encomendas
    DollarSign,      // Financeiro
    FolderKanban,    // Projetos
    Settings,
    X,
    Menu,
    ChevronLeft,
    ChevronRight,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeSwitcherPill } from '@/components/ui/theme-switcher';
// import { NotificationToggle } from '@/components/NotificationToggle'; // Notification is tricky in sidebar, lets skip for now or add simple
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLocale } from '@/contexts/LocaleContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =============================================================================
// Navigation Items Configuration
// =============================================================================

interface NavSection {
    title: string;
    items: NavItem[];
}

interface NavItem {
    to: string;
    icon: LucideIcon;
    label: string;
    color: string;
    bg: string;
    badge?: {
        value?: string | number;
        color?: string;
    };
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: 'GESTÃO',
        items: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-nav-dashboard', bg: 'bg-nav-dashboard/10' },
            { to: '/projetos', icon: FolderKanban, label: 'Projetos', color: 'text-nav-projects', bg: 'bg-nav-projects/10' },
            { to: '/encomendas', icon: ClipboardList, label: 'Encomendas', color: 'text-nav-reports', bg: 'bg-nav-reports/10' },
        ]
    },
    {
        title: 'CADASTROS',
        items: [
            { to: '/clientes', icon: Users, label: 'Clientes', color: 'text-nav-clients', bg: 'bg-nav-clients/10' },
            { to: '/produtos', icon: Package, label: 'Produtos', color: 'text-nav-projects', bg: 'bg-nav-projects/10' },
            { to: '/fornecedores', icon: Truck, label: 'Fornecedores', color: 'text-nav-finance', bg: 'bg-nav-finance/10' },
        ]
    },
    {
        title: 'FINANCEIRO',
        items: [
            { to: '/financeiro', icon: DollarSign, label: 'Financeiro', color: 'text-nav-finance', bg: 'bg-nav-finance/10' },
        ]
    }
];

// Helper wrapper for Shadcn Tooltip because it works differently than the one in inove-ai-dev source
const NavTooltip = ({ children, content, side = "right" }: { children: React.ReactNode, content: string, side?: "right" | "top" | "bottom" | "left" }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
            {content}
        </TooltipContent>
    </Tooltip>
);

/**
 * Helper component for navigation links
 */
interface SidebarItemProps {
    to: string;
    icon: LucideIcon;
    label: string;
    color: string;
    bg: string;
    onClick?: () => void;
    isCollapsed?: boolean;
}

const SidebarItem = ({
    to,
    icon: Icon,
    label,
    color,
    bg,
    onClick,
    isCollapsed
}: SidebarItemProps) => {
    const itemContent = (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex items-center transition-all duration-300 relative group/item",
                    isCollapsed
                        ? "w-12 h-12 justify-center rounded-2xl mx-auto"
                        : "px-3 py-1.5 rounded-2xl gap-4 mb-0.5",
                    isActive
                        ? "bg-[var(--sidebar-active)] text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-[var(--sidebar-active)]/50 hover:text-foreground"
                )
            }
        >
            {({ isActive }) => (
                <>
                    {/* Active Indicator Bar */}
                    {isActive && (
                        <div
                            className={cn(
                                "absolute bg-primary rounded-full transition-all duration-300 z-10",
                                isCollapsed
                                    ? "-left-2 top-1/2 -translate-y-1/2 w-1 h-5 shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                                    : "left-0 top-1/2 -translate-y-1/2 w-1 h-6"
                            )}
                        />
                    )}

                    {/* Circle Icon Container */}
                    <div className={cn(
                        "w-11 h-11 rounded-full shrink-0 flex items-center justify-center transition-all duration-300",
                        // Destaque maior para o ícone ativo
                        isActive ? bg.replace('/10', '/30') : bg,
                        isActive && "scale-110 shadow-lg shadow-primary/10",
                        color
                    )}>
                        <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
                    </div>

                    {!isCollapsed && (
                        <span className={cn(
                            "transition-all duration-300 text-[15px]",
                            isActive ? "font-bold text-foreground" : "font-medium"
                        )}>
                            {label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );

    if (isCollapsed) {
        return (
            <NavTooltip content={label} side="right">
                {itemContent}
            </NavTooltip>
        );
    }

    return itemContent;
};

// =============================================================================
// Sidebar Content Component
// =============================================================================

interface SidebarContentProps {
    mobile?: boolean;
    isCollapsed?: boolean;
    toggleCollapsed?: () => void;
    closeMobile: () => void;
}

interface CollapsibleSectionProps {
    title: string;
    items: NavItem[];
    isExpanded: boolean;
    onToggle: () => void;
    isCollapsed?: boolean;
    mobile?: boolean;
    closeMobile: () => void;
}

const CollapsibleSection = ({
    title,
    items,
    isExpanded,
    onToggle,
    isCollapsed,
    mobile,
    closeMobile
}: CollapsibleSectionProps) => {
    return (
        <div className={cn(isCollapsed && "mb-2")}>
            {/* Section Header */}
            {!isCollapsed && !mobile && (
                <button
                    onClick={onToggle}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider hover:text-[var(--text-secondary)] transition-colors group"
                >
                    <span>{title}</span>
                    <ChevronRight
                        className={cn(
                            "w-3.5 h-3.5 transition-transform duration-300",
                            isExpanded && "rotate-90"
                        )}
                    />
                </button>
            )}

            {/* Section Items */}
            <div className={cn(
                "transition-all duration-300",
                // Overflow hidden necessário apenas para animação de accordion (modo expandido).
                // No modo recolhido, deve ser visible para não cortar ícones/sombras.
                !isCollapsed ? "overflow-hidden" : "overflow-visible",
                !isExpanded && !isCollapsed && !mobile && "max-h-0 opacity-0",
                (isExpanded || isCollapsed || mobile) && "max-h-[1000px] opacity-100",
                isCollapsed && "flex flex-col gap-3" // Grid de 12px entre itens quando recolhido
            )}>
                {items.map((item) => (
                    <SidebarItem
                        key={item.to}
                        {...item}
                        onClick={mobile ? closeMobile : undefined}
                        isCollapsed={!mobile && isCollapsed}
                    />
                ))}
            </div>
        </div>
    );
};

const SidebarContent = ({
    mobile = false,
    isCollapsed = false,
    toggleCollapsed,
    closeMobile
}: SidebarContentProps) => {
    const { user } = useAuth();
    const { locale } = useLocale();
    const userEmail = user?.email?.toLowerCase();

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'GESTÃO': true,
        'CADASTROS': true,
        'FINANCEIRO': true,
    });

    const toggleSection = (sectionTitle: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle]
        }));
    };

    // Filter and Translate Sections
    const filteredSections = NAV_SECTIONS.map(section => {
        let sectionTitle = section.title;
        if (locale === 'fr-FR') {
            if (section.title === 'GESTÃO') sectionTitle = 'GESTION';
            if (section.title === 'CADASTROS') sectionTitle = 'CATALOGUE';
            if (section.title === 'FINANCEIRO') sectionTitle = 'FINANCES';
        }

        return {
            ...section,
            title: sectionTitle,
            items: section.items.map(item => {
                // Translate label if needed
                let label = item.label;
                if (locale === 'fr-FR') {
                    if (item.to === '/encomendas') label = 'Commandes';
                    if (item.to === '/projetos') label = 'Projets';
                    if (item.to === '/financeiro') label = 'Finances';
                    if (item.to === '/produtos') label = 'Produits';
                }
                return { ...item, label };
            }).filter(item => {
                // Ham restrictions
                if (userEmail === 'ham@admin.com') {
                    return ['/projetos', '/encomendas', '/produtos', '/financeiro'].includes(item.to);
                }
                return true;
            })
        };
    }).filter(section => section.items.length > 0);

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário';
    const formattedName = displayName.replace(/\d+/g, '').split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    const displaySubtitle = user?.email === 'jbento1@gmail.com' ? 'Proprietário' : (user?.email || 'Membro da Equipe');
    const initials = formattedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full w-full bg-[var(--surface)] border-r border-[var(--border)] relative shadow-2xl">
            {/* Header with Logo */}
            <div className={cn(
                "py-3 flex flex-col items-center justify-center border-b border-[var(--border)] relative",
                mobile ? "px-6" : "px-2"
            )}>
                <div className="flex flex-col items-center justify-center w-full">
                    {/* Logo Image */}
                    <div className={cn("relative transition-all duration-300 flex items-center justify-center", isCollapsed && !mobile ? "w-10 h-10" : "w-20 h-20")}>
                        {/* Logo para Light Mode (texto preto) */}
                        <img
                            src="/chs-logo-for-light-mode.png"
                            alt="CHS Logo"
                            className="absolute inset-0 w-full h-full object-contain dark:hidden transition-transform duration-300 hover:scale-105"
                        />
                        {/* Logo para Dark Mode (texto branco) */}
                        <img
                            src="/chs-logo-for-dark-mode.png"
                            alt="CHS Logo"
                            className="absolute inset-0 w-full h-full object-contain hidden dark:block transition-transform duration-300 hover:scale-105"
                        />
                    </div>

                    {/* Mobile Close Button */}
                    {mobile && (
                        <Button variant="ghost" size="icon-sm" onClick={closeMobile} className="absolute right-4 top-4">
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Desktop Toggle Button */}
                {!mobile && toggleCollapsed && (
                    <NavTooltip content={isCollapsed ? "Expandir" : "Recolher"} side="right">
                        <button
                            onClick={toggleCollapsed}
                            className={cn(
                                "absolute -right-3 bottom-0 translate-y-1/2 z-50",
                                "h-6 w-6 rounded-full",
                                "bg-[var(--surface-elevated)] border border-[var(--border)] shadow-xl",
                                "flex items-center justify-center",
                                "text-[var(--text-secondary)] hover:text-[var(--primary)]",
                                "hover:border-[var(--primary)] hover:scale-110 transition-all group"
                            )}
                        >
                            {isCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            ) : (
                                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            )}
                        </button>
                    </NavTooltip>
                )}
            </div>

            <nav className={cn(
                "flex-1 px-3 custom-scrollbar transition-all duration-300",
                // Modo Recolhido: Layout Flexivel vertical centralizado
                isCollapsed
                    ? "flex flex-col items-center justify-center py-4"
                    : "overflow-y-auto py-1 space-y-0.5"
            )}>
                {filteredSections.map((section, sectionIndex) => (
                    <div key={section.title}>
                        <CollapsibleSection
                            title={section.title}
                            items={section.items}
                            isExpanded={expandedSections[section.title] ?? true}
                            onToggle={() => toggleSection(section.title)}
                            isCollapsed={isCollapsed}
                            mobile={mobile}
                            closeMobile={closeMobile}
                        />

                        {sectionIndex < filteredSections.length - 1 && (
                            <div className={cn(
                                "h-px bg-[var(--border)]",
                                // 24px acima (mt-6) e 24px abaixo (mb-6) da linha
                                isCollapsed ? "mt-6 mb-6 mx-auto w-10" : "my-3 mx-3"
                            )} />
                        )}
                    </div>
                ))}
            </nav>

            {/* Mobile Only: Profile & Settings Section */}
            {mobile && (
                <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-elevated)]/50 space-y-4">
                    {/* User Info & Logout */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase shadow-sm">
                                {initials}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--foreground)] leading-none mb-1">{formattedName}</p>
                                <p className="text-[10px] text-[var(--text-secondary)]">{displaySubtitle}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider pl-1">Tema</span>
                            <ThemeSwitcherPill size="sm" />
                        </div>
                    </div>
                </div>
            )}

            {/* Footer - Powered by */}
            <div className={cn(
                "p-4 border-t border-[var(--border)] flex flex-col items-center gap-1",
                isCollapsed && !mobile && "py-3"
            )}>
                {!isCollapsed && !mobile && (
                    <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        Powered by
                    </span>
                )}
                <img
                    src="/inove-ai-logo.jpg"
                    alt="Inove AI"
                    className={cn(
                        "object-contain rounded-md opacity-70 hover:opacity-100 transition-opacity",
                        isCollapsed && !mobile ? "w-8 h-8" : "w-12 h-12"
                    )}
                />
            </div>
        </div>
    );
};

// =============================================================================
// Main Sidebar Component
// =============================================================================

interface SidebarProps {
    isMobileOpen: boolean;
    closeMobile: () => void;
    onMobileMenuClick: () => void;
    isCollapsed?: boolean;
    toggleCollapsed?: () => void;
}

export const Sidebar = ({
    isMobileOpen,
    closeMobile,
    onMobileMenuClick,
    isCollapsed = false,
    toggleCollapsed,
}: SidebarProps) => {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden xl:flex fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <SidebarContent
                    isCollapsed={isCollapsed}
                    toggleCollapsed={toggleCollapsed}
                    closeMobile={closeMobile}
                />
            </aside>

            {/* Mobile Top Bar Handle (Invisible but functional via TopBar typically, 
                but here we add a safe trigger if TopBar isn't meant to have the menu trigger everywhere) 
                Actually Inove AI handles mobile menu trigger in TopBar. 
                We'll include the mobile drawer logic here. */}

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
                    onClick={closeMobile}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside
                className={cn(
                    "xl:hidden fixed top-0 left-0 h-full w-72 z-50 transition-transform duration-300 ease-out shadow-2xl",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent mobile closeMobile={closeMobile} />
            </aside>
        </>
    );
};
