// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="space-y-8 p-8 text-center">
        <div className="bg-primary inline-flex rounded-xl p-10 shadow-lg">
          <svg
            className="h-20 w-20 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-foreground text-5xl font-bold">
            Bem-vindo ao Gestion CHS
          </h1>
          <p className="text-muted-foreground max-w-2xl text-xl font-medium">
            Sistema completo de gestão empresarial com design moderno e vibrante
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <a
            href="/dashboard"
            className="bg-primary hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-lg px-8 font-medium text-primary-foreground transition-colors"
          >
            Acessar Dashboard
          </a>
          <a
            href="/produtos"
            className="border-primary text-primary hover:bg-primary/10 inline-flex h-12 items-center justify-center rounded-lg border-2 px-8 font-medium transition-colors"
          >
            Ver Produtos
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
