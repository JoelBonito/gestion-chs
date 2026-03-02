import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });

      // 🔽 regra de redirecionamento personalizada
      const userEmail = email.trim().toLowerCase();

      if (userEmail === "ham@admin.com" || userEmail === "rosa@colaborador.com") {
        navigate("/encomendas");
      } else {
        navigate("/dashboard"); // rota padrão para os outros usuários
      }
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="border-border rounded-xl border bg-[var(--surface-elevated)] p-8 shadow-sm">
          <div className="mb-8 flex flex-col items-center space-y-2 text-center">
            <div className="relative mb-6 flex h-24 w-full items-center justify-center">
              <picture className="h-24 w-auto dark:hidden">
                <source srcSet="/chs-logo-light.webp" type="image/webp" />
                <img
                  src="/chs-logo-light.png"
                  alt="Gestion CHS"
                  className="h-24 w-auto object-contain transition-transform hover:scale-105"
                />
              </picture>
              <picture className="hidden h-24 w-auto dark:block">
                <source srcSet="/chs-logo-dark.webp" type="image/webp" />
                <img
                  src="/chs-logo-dark.png"
                  alt="Gestion CHS"
                  className="h-24 w-auto object-contain transition-transform hover:scale-105"
                />
              </picture>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Bem-vindo</h1>
            <p className="text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="ml-1 text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="ml-1 text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              className="h-11 w-full text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-8 text-center text-xs">
            Gestão CHS © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
