/**
 * INOVE AI Design System - Main Sidebar
 * Adapted for Gestion CHS
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, // Dashboard
  Package, // Produtos
  Users, // Clientes
  Truck, // Fornecedores
  ClipboardList, // Encomendas
  DollarSign, // Financeiro
  FolderKanban, // Projetos
  Settings,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeSwitcherPill } from "@/components/ui/theme-switcher";
// import { NotificationToggle } from '@/components/NotificationToggle'; // Notification is tricky in sidebar, lets skip for now or add simple
import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useLocale } from "@/contexts/LocaleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    title: "GESTÃO",
    items: [
      {
        to: "/dashboard",
        icon: LayoutDashboard,
        label: "Dashboard",
        color: "text-nav-dashboard",
        bg: "bg-nav-dashboard/10",
      },
      {
        to: "/projetos",
        icon: FolderKanban,
        label: "Projetos",
        color: "text-nav-projects",
        bg: "bg-nav-projects/10",
      },
      {
        to: "/encomendas",
        icon: ClipboardList,
        label: "Encomendas",
        color: "text-nav-reports",
        bg: "bg-nav-reports/10",
      },
    ],
  },
  {
    title: "CADASTROS",
    items: [
      {
        to: "/clientes",
        icon: Users,
        label: "Clientes",
        color: "text-nav-clients",
        bg: "bg-nav-clients/10",
      },
      {
        to: "/produtos",
        icon: Package,
        label: "Produtos",
        color: "text-nav-projects",
        bg: "bg-nav-projects/10",
      },
      {
        to: "/fornecedores",
        icon: Truck,
        label: "Fornecedores",
        color: "text-nav-finance",
        bg: "bg-nav-finance/10",
      },
    ],
  },
  {
    title: "FINANCEIRO",
    items: [
      {
        to: "/financeiro",
        icon: DollarSign,
        label: "Financeiro",
        color: "text-nav-finance",
        bg: "bg-nav-finance/10",
      },
    ],
  },
];

// Helper wrapper for Shadcn Tooltip because it works differently than the one in inove-ai-dev source
const NavTooltip = ({
  children,
  content,
  side = "right",
}: {
  children: React.ReactNode;
  content: string;
  side?: "right" | "top" | "bottom" | "left";
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side}>{content}</TooltipContent>
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
  isCollapsed,
}: SidebarItemProps) => {
  const itemContent = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group/item relative flex items-center transition-all duration-300",
          isCollapsed
            ? "mx-auto h-12 w-12 justify-center rounded-2xl"
            : "mb-0.5 gap-4 rounded-2xl px-3 py-1.5",
          isActive
            ? "text-foreground bg-[var(--sidebar-active)] shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-[var(--sidebar-active)]/50"
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Indicator Bar */}
          {isActive && (
            <div
              className={cn(
                "bg-primary absolute z-10 rounded-full transition-all duration-300",
                isCollapsed
                  ? "top-1/2 -left-2 h-5 w-1 -translate-y-1/2 shadow-[0_0_8px_rgba(var(--primary),0.6)]"
                  : "top-1/2 left-0 h-6 w-1 -translate-y-1/2"
              )}
            />
          )}

          {/* Circle Icon Container */}
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all duration-300",
              // Destaque maior para o ícone ativo
              isActive ? bg.replace("/10", "/30") : bg,
              isActive && "shadow-primary/10 scale-110 shadow-lg",
              color
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
          </div>

          {!isCollapsed && (
            <span
              className={cn(
                "text-[15px] transition-all duration-300",
                isActive ? "text-foreground font-bold" : "font-medium"
              )}
            >
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
  closeMobile,
}: CollapsibleSectionProps) => {
  return (
    <div className={cn(isCollapsed && "mb-2")}>
      {/* Section Header */}
      {!isCollapsed && !mobile && (
        <button
          onClick={onToggle}
          className="group flex w-full items-center justify-between px-3 py-2 text-xs font-bold tracking-wider text-[var(--text-tertiary)] uppercase transition-colors hover:text-[var(--text-secondary)]"
        >
          <span>{title}</span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              isExpanded && "rotate-90"
            )}
          />
        </button>
      )}

      {/* Section Items */}
      <div
        className={cn(
          "transition-all duration-300",
          // Overflow hidden necessário apenas para animação de accordion (modo expandido).
          // No modo recolhido, deve ser visible para não cortar ícones/sombras.
          !isCollapsed ? "overflow-hidden" : "overflow-visible",
          !isExpanded && !isCollapsed && !mobile && "max-h-0 opacity-0",
          (isExpanded || isCollapsed || mobile) && "max-h-[1000px] opacity-100",
          isCollapsed && "flex flex-col gap-3" // Grid de 12px entre itens quando recolhido
        )}
      >
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
  closeMobile,
}: SidebarContentProps) => {
  const { user } = useAuth();
  const { locale } = useLocale();
  const userEmail = user?.email?.toLowerCase();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    GESTÃO: true,
    CADASTROS: true,
    FINANCEIRO: true,
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Filter and Translate Sections
  const filteredSections = NAV_SECTIONS.map((section) => {
    let sectionTitle = section.title;
    if (locale === "fr-FR") {
      if (section.title === "GESTÃO") sectionTitle = "GESTION";
      if (section.title === "CADASTROS") sectionTitle = "CATALOGUE";
      if (section.title === "FINANCEIRO") sectionTitle = "FINANCES";
    }

    return {
      ...section,
      title: sectionTitle,
      items: section.items
        .map((item) => {
          // Translate label if needed
          let label = item.label;
          if (locale === "fr-FR") {
            if (item.to === "/encomendas") label = "Commandes";
            if (item.to === "/projetos") label = "Projets";
            if (item.to === "/financeiro") label = "Finances";
            if (item.to === "/produtos") label = "Produits";
          }
          return { ...item, label };
        })
        .filter((item) => {
          // Ham restrictions
          if (userEmail === "ham@admin.com") {
            return ["/projetos", "/encomendas", "/produtos", "/financeiro"].includes(item.to);
          }
          return true;
        }),
    };
  }).filter((section) => section.items.length > 0);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Usuário";
  const formattedName = displayName
    .replace(/\d+/g, "")
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const displaySubtitle =
    user?.email === "jbento1@gmail.com" ? "Proprietário" : user?.email || "Membro da Equipe";
  const initials = formattedName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex h-full w-full flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl">
      {/* Header with Logo */}
      <div
        className={cn(
          "relative flex flex-col items-center justify-center border-b border-[var(--border)] py-3",
          mobile ? "px-6" : "px-2"
        )}
      >
        <div className="flex w-full flex-col items-center justify-center">
          {/* Logo Image */}
          <div
            className={cn(
              "relative flex items-center justify-center transition-all duration-300",
              isCollapsed && !mobile ? "h-10 w-10" : "h-20 w-20"
            )}
          >
            {/* Logo para Light Mode (texto preto) */}
            <img
              src="/chs-logo-for-light-mode.png"
              alt="CHS Logo"
              className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 hover:scale-105 dark:hidden"
            />
            {/* Logo para Dark Mode (texto branco) */}
            <img
              src="/chs-logo-for-dark-mode.png"
              alt="CHS Logo"
              className="absolute inset-0 hidden h-full w-full object-contain transition-transform duration-300 hover:scale-105 dark:block"
            />
          </div>

          {/* Mobile Close Button */}
          {mobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeMobile}
              className="absolute top-4 right-4"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Desktop Toggle Button */}
        {!mobile && toggleCollapsed && (
          <NavTooltip content={isCollapsed ? "Expandir" : "Recolher"} side="right">
            <button
              onClick={toggleCollapsed}
              className={cn(
                "absolute -right-3 bottom-0 z-50 translate-y-1/2",
                "h-6 w-6 rounded-full",
                "border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl",
                "flex items-center justify-center",
                "text-[var(--text-secondary)] hover:text-[var(--primary)]",
                "group transition-all hover:scale-110 hover:border-[var(--primary)]"
              )}
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              )}
            </button>
          </NavTooltip>
        )}
      </div>

      <nav
        className={cn(
          "custom-scrollbar flex-1 px-3 transition-all duration-300",
          // Modo Recolhido: Layout Flexivel vertical centralizado
          isCollapsed
            ? "flex flex-col items-center justify-center py-4"
            : "space-y-0.5 overflow-y-auto py-1"
        )}
      >
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
              <div
                className={cn(
                  "h-px bg-[var(--border)]",
                  // 24px acima (mt-6) e 24px abaixo (mb-6) da linha
                  isCollapsed ? "mx-auto mt-6 mb-6 w-10" : "mx-3 my-3"
                )}
              />
            )}
          </div>
        ))}
      </nav>

      {/* Mobile Only: Profile & Settings Section */}
      {mobile && (
        <div className="space-y-4 border-t border-[var(--border)] bg-[var(--surface-elevated)]/50 px-6 py-4">
          {/* User Info & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold uppercase shadow-sm">
                {initials}
              </div>
              <div>
                <p className="mb-1 text-sm leading-none font-bold text-[var(--foreground)]">
                  {formattedName}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)]">{displaySubtitle}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2">
              <span className="pl-1 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
                Tema
              </span>
              <ThemeSwitcherPill size="sm" />
            </div>
          </div>
        </div>
      )}

      {/* Footer - Powered by */}
      <div
        className={cn(
          "flex flex-col items-center gap-1 border-t border-[var(--border)] p-4",
          isCollapsed && !mobile && "py-3"
        )}
      >
        {!isCollapsed && !mobile && (
          <span className="text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase">
            Powered by
          </span>
        )}
        <img
          src="/inove-ai-logo.jpg"
          alt="Inove AI"
          className={cn(
            "rounded-md object-contain opacity-70 transition-opacity hover:opacity-100",
            isCollapsed && !mobile ? "h-8 w-8" : "h-12 w-12"
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
          "fixed top-0 left-0 z-40 hidden h-screen transition-all duration-300 ease-in-out xl:flex",
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
          className="animate-in fade-in fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-200 xl:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 shadow-2xl transition-transform duration-300 ease-out xl:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent mobile closeMobile={closeMobile} />
      </aside>
    </>
  );
};
