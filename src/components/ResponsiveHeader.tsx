import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsCollaborator } from "@/hooks/useIsCollaborator";
import { useLocale } from "@/contexts/LocaleContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileMenu } from "./MobileMenu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";

interface ResponsiveHeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function ResponsiveHeader({ title, subtitle, actions }: ResponsiveHeaderProps) {
  const { user } = useAuth();
  const { isCollaborator } = useIsCollaborator();
  const { isRestrictedFR } = useLocale();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();

  // i18n helper
  const isHam = user?.email?.toLowerCase() === "ham@admin.com";
  const lang: "pt" | "fr" = isHam || isRestrictedFR ? "fr" : "pt";
  const t = (k: string) => {
    const d: Record<string, { pt: string, fr: string }> = {
      "Logout realizado": { pt: "Logout realizado", fr: "Déconnexion réussie" },
      "Até a próxima!": { pt: "Até a próxima!", fr: "À bientôt !" },
      "Sair": { pt: "Sair", fr: "Se déconnecter" }
    };
    return d[k]?.[lang] || k;
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: t("Logout realizado"),
        description: t("Até a próxima!"),
      });
      navigate("/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    }
  };

  const getHomeLink = () => {
    if (isRestrictedFR) return "/encomendas";
    if (isCollaborator) return "/produtos";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-20 max-w-screen-2xl items-center px-6">
        <div className="mr-4 flex">
          {isMobile && <MobileMenu />}

          <Link to={getHomeLink()} className="mr-6 flex items-center space-x-3 group">
            {!isMobile && (
              <div className="transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/logo-inove.jpg"
                  alt="Gestion CHS Logo"
                  className="h-10 w-auto rounded-lg"
                />
              </div>
            )}
            <span className="hidden font-bold sm:inline-block text-2xl bg-gradient-to-r from-primary via-primary-dark to-primary-glow bg-clip-text text-transparent">
              Gestion CHS
            </span>
          </Link>
        </div>

        {title && (
          <div className="flex-1 mr-4">
            <h1 className="text-xl sm:text-3xl font-bold truncate bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{title}</h1>
            {subtitle && !isMobile && (
              <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex items-center space-x-3">
          {actions && <div className="flex items-center space-x-3">{actions}</div>}

          {!isMobile && user && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-accent to-accent/50 border border-primary/10">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-primary-dark">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 rounded-2xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("Sair")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}