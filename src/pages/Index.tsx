// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 p-8">
        <div className="inline-flex p-10 rounded-xl bg-primary shadow-lg">
          <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h1 className="text-5xl font-display font-bold text-foreground">
            Bem-vindo ao Gestion CHS
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl">
            Sistema completo de gestão empresarial com design moderno e vibrante
          </p>
        </div>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Acessar Dashboard
          </a>
          <a
            href="/produtos"
            className="inline-flex items-center justify-center h-12 px-8 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
          >
            Ver Produtos
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
