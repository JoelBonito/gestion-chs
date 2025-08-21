
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-dark mb-2">Sistema de Gestão</h1>
          <p className="text-muted-foreground">Plataforma completa para gestão empresarial</p>
        </div>
        
        <AuthForm 
          mode={mode}
          onToggleMode={handleToggleMode}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
