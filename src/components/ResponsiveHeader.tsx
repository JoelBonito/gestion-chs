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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até a próxima!",
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          {isMobile && <MobileMenu />}
          
          <Link to={getHomeLink()} className="mr-6 flex items-center space-x-2">
            {!isMobile && (
              <img 
                src="/lovable-uploads/634e6285-ffdf-4457-8136-8a0d8840bdd6.png" 
                alt="Gestion CHS Logo" 
                className="h-8 w-auto"
              />
            )}
            <span className="hidden font-bold sm:inline-block text-xl bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Gestion CHS
            </span>
          </Link>
        </div>

        {title && (
          <div className="flex-1 mr-4">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{title}</h1>
            {subtitle && !isMobile && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2">
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
          
          {!isMobile && user && (
            <>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-md bg-muted/50">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}