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
    const d: Record<string, { pt: string; fr: string }> = {
      "Logout realizado": { pt: "Logout realizado", fr: "Déconnexion réussie" },
      "Até a próxima!": { pt: "Até a próxima!", fr: "À bientôt !" },
      Sair: { pt: "Sair", fr: "Se déconnecter" },
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
    <header className="border-border/50 sticky top-0 z-40 w-full border-b bg-white/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-20 max-w-screen-2xl items-center px-6">
        <div className="mr-4 flex">
          {isMobile && <MobileMenu />}

          <Link to={getHomeLink()} className="group mr-6 flex items-center space-x-3">
            {!isMobile && (
              <div className="transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/logo-inove.jpg"
                  alt="Gestion CHS Logo"
                  className="h-10 w-auto rounded-lg"
                />
              </div>
            )}
            <span className="from-primary via-primary-dark to-primary-glow hidden bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent sm:inline-block">
              Gestion CHS
            </span>
          </Link>
        </div>

        {title && (
          <div className="mr-4 flex-1">
            <h1 className="from-foreground to-foreground/70 truncate bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent sm:text-3xl">
              {title}
            </h1>
            {subtitle && !isMobile && (
              <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex items-center space-x-3">
          {actions && <div className="flex items-center space-x-3">{actions}</div>}

          {!isMobile && user && (
            <>
              <div className="from-accent to-accent/50 border-primary/10 hidden items-center space-x-2 rounded-2xl border bg-gradient-to-r px-4 py-2 sm:flex">
                <div className="from-primary to-primary-dark rounded-lg bg-gradient-to-br p-1.5">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-foreground text-sm font-medium">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 rounded-2xl"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("Sair")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
