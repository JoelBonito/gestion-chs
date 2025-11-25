// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
      <div className="text-center space-y-8 p-8 animate-scale-in">
        <div className="inline-flex p-10 rounded-3xl bg-gradient-to-br from-primary to-primary-dark shadow-icon animate-float">
          <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary-dark to-primary-glow bg-clip-text text-transparent">
            Bem-vindo ao Gestion CHS
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Sistema completo de gestão empresarial com design moderno e vibrante
          </p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <a 
            href="/dashboard" 
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-medium shadow-button hover:shadow-hover hover:scale-105 transition-all duration-300"
          >
            Acessar Dashboard
          </a>
          <a 
            href="/produtos" 
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl border-2 border-primary/20 bg-background hover:bg-primary/5 hover:border-primary/40 hover:scale-105 transition-all duration-300 font-medium"
          >
            Ver Produtos
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
