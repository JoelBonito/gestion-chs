import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  Settings,
  LogOut,
  Bell,
  Bug,
  Menu,
  ChevronDown,
  UserCog,
  Loader2,
  X,
  Save,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { ThemeSwitcherPill } from "./ui/theme-switcher";
import { NotificationToggle } from "./NotificationToggle";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useTopBarActions } from "@/context/TopBarActionsContext";

interface FloatingTopBarProps {
  onMobileMenuClick?: () => void;
  isSidebarCollapsed?: boolean;
}

// Route to Page Title mapping
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/clientes": "Clientes",
  "/fornecedores": "Fornecedores",
  "/encomendas": "Encomendas",
  "/produtos": "Produtos",
  "/producao": "Produção",
  "/financeiro": "Financeiro",
  "/projetos": "Projetos",
  "/perfil": "Meu Perfil",
  "/welcome": "Bem-vindo",
};

export const FloatingTopBar = ({
  onMobileMenuClick,
  isSidebarCollapsed = false,
}: FloatingTopBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Edit Name State
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Consume Dynamic Actions
  const { actions } = useTopBarActions();

  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const lang: "pt" | "fr" = isHam ? "fr" : "pt";

  const t = (k: string) => {
    const d: Record<string, { pt: string; fr: string }> = {
      Dashboard: { pt: "Dashboard", fr: "Tableau de bord" },
      Clientes: { pt: "Clientes", fr: "Clients" },
      Fornecedores: { pt: "Fornecedores", fr: "Fournisseurs" },
      Encomendas: { pt: "Encomendas", fr: "Commandes" },
      Produtos: { pt: "Produtos", fr: "Produits" },
      Produção: { pt: "Produção", fr: "Production" },
      Financeiro: { pt: "Financeiro", fr: "Finances" },
      Projetos: { pt: "Projetos", fr: "Projets" },
      "Meu Perfil": { pt: "Meu Perfil", fr: "Mon Profil" },
      "Bem-vindo": { pt: "Bem-vindo", fr: "Bienvenue" },
      "Logout realizado": { pt: "Logout realizado", fr: "Déconnexion réussie" },
      "Até a próxima!": { pt: "Até a próxima!", fr: "À la prochaine !" },
      "Nome atualizado!": { pt: "Nome atualizado!", fr: "Nom mis à jour !" },
      "Seu nome de exibição foi alterado com sucesso.": {
        pt: "Seu nome de exibição foi alterado com sucesso.",
        fr: "Votre nom d'affichage a été modifié avec succès.",
      },
      "Erro ao atualizar": { pt: "Erro ao atualizar", fr: "Erreur lors de la mise à jour" },
      "Não foi possível atualizar seu nome.": {
        pt: "Não foi possível atualizar seu nome.",
        fr: "Impossible de mettre à jour votre nom.",
      },
      "Alterar Nome": { pt: "Alterar Nome", fr: "Changer le nom" },
      "Sair da Conta": { pt: "Sair da Conta", fr: "Se déconnecter" },
      "Alterar Nome de Exibição": {
        pt: "Alterar Nome de Exibição",
        fr: "Changer le nom d'affichage",
      },
      "Escolha como você quer ser identificado no sistema.": {
        pt: "Escolha como você quer ser identificado no sistema.",
        fr: "Choisissez comment vous souhaitez être identifié dans le système.",
      },
      Nome: { pt: "Nome", fr: "Nom" },
      "Seu nome": { pt: "Seu nome", fr: "Votre nom" },
      Cancelar: { pt: "Cancelar", fr: "Annuler" },
      Salvar: { pt: "Salvar", fr: "Sauvegarder" },
      Proprietário: { pt: "Proprietário", fr: "Propriétaire" },
      "Membro da Equipe": { pt: "Membro da Equipe", fr: "Membre de l'équipe" },
      Usuário: { pt: "Usuário", fr: "Utilisateur" },
    };
    return d[k]?.[lang] || k;
  };

  // Get current page title based on location
  const currentPageTitle = t(pageTitles[location.pathname] || "Gestion CHS");

  // Monitor scroll to apply glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Derived User Info
  // Prioritize display_name from metadata, fallback to email prefix
  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || t("Usuário");
  const formattedName = displayName
    .replace(/\d+/g, "")
    .split(/[._-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const displaySubtitle =
    user?.email === "jbento1@gmail.com" ? t("Proprietário") : user?.email || t("Membro da Equipe");
  const initials = formattedName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t("Logout realizado"),
        description: t("Até a próxima!"),
      });
      navigate("/login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: newName },
      });

      if (error) throw error;

      toast({
        title: t("Nome atualizado!"),
        description: t("Seu nome de exibição foi alterado com sucesso."),
      });
      setIsEditNameOpen(false);
      // Force refresh of user context implies waiting for auth state change usually handled by provider
    } catch (error) {
      console.error("Error updating name:", error);
      toast({
        title: t("Erro ao atualizar"),
        description: t("Não foi possível atualizar seu nome."),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-30 transition-all duration-500 ease-in-out",
          "h-16 px-4 md:px-8",
          "flex items-center justify-between",
          // Mobile layout covers whole width
          "left-0 xl:left-auto",
          // Desktop dynamic width based on sidebar
          isSidebarCollapsed ? "xl:w-[calc(100%-80px)]" : "xl:w-[calc(100%-256px)]",
          // Glassmorphism effect logic
          isScrolled
            ? "bg-card/80 border-b border-[var(--border)] shadow-sm backdrop-blur-xl"
            : "border-transparent bg-transparent shadow-none"
        )}
      >
        {/* Left side: Mobile Menu + Page Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuClick}
            className="text-[var(--text-secondary)] xl:hidden"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-6 w-6" />
          </Button>

          {/* Dynamic Page Title */}
          <h1 className="font-display text-xl font-bold tracking-tight text-[var(--foreground)] md:text-2xl">
            {currentPageTitle}
          </h1>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Dynamic ACTIONS Teleported from Page */}
          {actions && (
            <div className="animate-in fade-in slide-in-from-top-1 mr-1 flex items-center gap-2 duration-300">
              {actions}
            </div>
          )}

          {actions && <div className="mx-1 h-6 w-px bg-[var(--border)]" />}

          {/* Notification Toggle */}
          <div className="hidden md:block">
            <NotificationToggle />
          </div>

          {/* Theme Switcher Pill */}
          <div className="hidden md:block">
            <ThemeSwitcherPill size="sm" />
          </div>

          <div className="mx-1 hidden h-6 w-px bg-[var(--border)] md:block" />

          {/* User Profile Dropdown / Trigger */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl p-1 px-1.5 transition-all",
                "hover:bg-accent border border-transparent",
                isProfileOpen && "bg-accent"
              )}
            >
              <div className="bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold uppercase shadow-sm transition-colors">
                {initials}
              </div>
              <div className="text-left">
                <p className="mb-1 text-sm leading-none font-bold text-[var(--foreground)]">
                  {formattedName}
                </p>
                <p className="max-w-[120px] truncate text-[11px] leading-none text-[var(--text-secondary)]">
                  {displaySubtitle}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "ml-1 h-3.5 w-3.5 text-[var(--text-secondary)]/70 transition-transform",
                  isProfileOpen && "rotate-180"
                )}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="bg-card animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border)] shadow-2xl duration-200">
                  <div className="bg-accent/50 border-b border-[var(--border)] p-3">
                    <p className="text-sm font-bold text-[var(--foreground)]">{displayName}</p>
                    <p className="truncate text-xs text-[var(--text-secondary)]">{user?.email}</p>
                  </div>

                  <div className="border-b border-[var(--border)] p-1">
                    <button
                      onClick={() => {
                        setNewName(displayName);
                        setIsEditNameOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)]"
                    >
                      <UserCog className="h-4 w-4 text-[var(--primary)]" />
                      {t("Alterar Nome")}
                    </button>
                  </div>

                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--error)] transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="h-5 w-5" />
                      {t("Sair da Conta")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Edit Name Modal */}
      <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("Alterar Nome de Exibição")}</DialogTitle>
            <DialogDescription>
              {t("Escolha como você quer ser identificado no sistema.")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t("Nome")}
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                placeholder={t("Seu nome")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="cancel" onClick={() => setIsEditNameOpen(false)} disabled={isUpdating}>
              <X className="mr-2 h-4 w-4" />
              {t("Cancelar")}
            </Button>
            <Button variant="gradient" onClick={handleUpdateName} disabled={isUpdating}>
              {isUpdating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t("Salvar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
