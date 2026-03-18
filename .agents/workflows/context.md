---
description: Cria documento de Project Context que cristaliza padrões técnicos, convenções e regras do projeto para garantir consistência.
---

# Workflow: /context

> **Propósito:** Documentar TODOS os padrões técnicos, convenções e regras "óbvias demais para mencionar" que garantem consistência no projeto.

## Quando Usar

- No início de um novo projeto (após `/define`)
- Quando um novo desenvolvedor (humano ou IA) entra no projeto
- Quando há necessidade de padronizar decisões técnicas

## Regras Críticas

1. **SEJA EXPLÍCITO** - Documente até o "óbvio"
2. **INCLUA EXEMPLOS** - Código > Descrição
3. **MANTENHA ATUALIZADO** - Documento vivo
4. **UNIFIQUE PADRÕES** - Uma fonte de verdade

---

## Fluxo de Execução

### Fase 0: Coleta de Informações

Pergunte ao usuário sobre preferências técnicas:

```markdown
🔧 Para criar o Project Context, preciso entender suas preferências:

### Stack Técnica
1. **Frontend:** (React, Vue, Next.js, Svelte, etc.)
2. **Backend:** (Node.js, Python, Go, etc.)
3. **Database:** (PostgreSQL, MongoDB, Firebase, Supabase, etc.)
4. **Linguagem principal:** (TypeScript, JavaScript, Python, etc.)

### Convenções
5. **Idioma do código:** (variáveis/funções em inglês ou português?)
6. **Idioma dos comentários:** (português ou inglês?)
7. **Idioma da UI:** (português, inglês, multi-idioma?)

### Preferências
8. **CSS Framework:** (Tailwind, CSS Modules, Styled Components?)
9. **Validação de dados:** (Zod, Yup, Joi, nativa?)
10. **Testes:** (Jest, Vitest, Playwright, Cypress?)
```

---

### Fase 1: Criar Documento

**Output:** `docs/PROJECT-CONTEXT.md`

```markdown
# Project Context: {Nome do Projeto}

> **Propósito:** Documento de referência para padrões técnicos e convenções do projeto.
> Todos os desenvolvedores (humanos e IA) DEVEM seguir estas regras.

## Metadados
- **Criado em:** {YYYY-MM-DD}
- **Última atualização:** {YYYY-MM-DD}
- **Versão:** 1.0

---

## 1. Stack Técnica

### 1.1 Versões Obrigatórias

| Tecnologia | Versão | Notas |
|------------|--------|-------|
| Node.js | >= 18.x | LTS recomendado |
| {Framework} | {versão} | |
| TypeScript | >= 5.0 | strict mode ON |
| {Database} | {versão} | |

### 1.2 Dependências Core

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    // ... outras
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "eslint": "^8.0.0",
    // ... outras
  }
}
```

### 1.3 Configuração TypeScript

```json
// tsconfig.json - Configuração obrigatória
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Regra:** Nenhum `any` permitido sem comentário justificativo.

```typescript
// ❌ PROIBIDO
const data: any = fetchData();

// ✅ PERMITIDO (com justificativa)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyData: any = externalLibrary.getData(); // API legada sem tipos
```

---

## 2. Estrutura de Diretórios

```
{projeto}/
├── src/
│   ├── app/                    # Pages (App Router) ou routes
│   ├── components/
│   │   ├── ui/                 # Componentes base (Button, Input, etc.)
│   │   ├── features/           # Componentes de features específicas
│   │   └── layouts/            # Layouts reutilizáveis
│   ├── hooks/                  # Custom hooks (prefixo use)
│   ├── lib/                    # Utilitários e helpers
│   ├── services/               # Integrações com APIs/backends
│   ├── stores/                 # Estado global (Zustand/Redux/Context)
│   ├── types/                  # Definições TypeScript
│   └── styles/                 # Estilos globais
├── tests/                      # Testes (espelha estrutura de src/)
├── public/                     # Assets estáticos
├── docs/                       # Documentação (NUNCA em src/)
│   ├── planning/               # Docs de planejamento
│   └── api/                    # Documentação de API
├── scripts/                    # Scripts de automação
└── .agents/                     # Framework Inove AI
```

### Regras de Organização

| Tipo de Arquivo | Localização | Exemplo |
|-----------------|-------------|---------|
| Componentes React | `src/components/` | `UserCard.tsx` |
| Hooks customizados | `src/hooks/` | `useAuth.ts` |
| Tipos TypeScript | `src/types/` | `user.types.ts` |
| Utilitários | `src/lib/` | `formatDate.ts` |
| Serviços/API | `src/services/` | `authService.ts` |
| Testes | `tests/` ou `__tests__/` | `UserCard.test.tsx` |
| Documentação | `docs/` | NUNCA em `src/` |

---

## 3. Convenções de Nomenclatura

### 3.1 Arquivos e Pastas

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase + prefixo use | `useAuth.ts` |
| Utilitários | camelCase | `formatCurrency.ts` |
| Tipos | camelCase + sufixo .types | `user.types.ts` |
| Constantes | camelCase ou kebab-case | `constants.ts` |
| Testes | mesmo nome + .test | `UserProfile.test.tsx` |
| CSS Modules | kebab-case | `user-profile.module.css` |
| Pastas | kebab-case | `user-management/` |

### 3.2 Código

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Variáveis | camelCase | `userName`, `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_URL` |
| Funções | camelCase | `getUserById()`, `formatDate()` |
| Classes | PascalCase | `UserService`, `AuthError` |
| Interfaces | PascalCase + prefixo I (opcional) | `User` ou `IUser` |
| Types | PascalCase | `UserRole`, `ApiResponse` |
| Enums | PascalCase | `UserStatus.Active` |
| Componentes | PascalCase | `<UserCard />` |
| Props | PascalCase + sufixo Props | `UserCardProps` |
| Hooks | camelCase + prefixo use | `useAuth()` |
| Eventos | camelCase + prefixo handle/on | `handleClick`, `onSubmit` |

### 3.3 Database (Firestore/SQL)

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Collections/Tables | snake_case, plural | `user_sessions`, `order_items` |
| Fields/Columns | camelCase | `createdAt`, `userId` |
| Índices | idx_{table}_{columns} | `idx_users_email` |
| Foreign Keys | {table}_id | `user_id`, `order_id` |

---

## 4. Padrões de Código

### 4.1 Componentes React

```tsx
// ✅ Estrutura padrão de componente
import { type FC } from 'react';
import { cn } from '@/lib/utils';

interface UserCardProps {
  user: User;
  variant?: 'default' | 'compact';
  onSelect?: (user: User) => void;
}

export const UserCard: FC<UserCardProps> = ({
  user,
  variant = 'default',
  onSelect,
}) => {
  // 1. Hooks primeiro
  const [isHovered, setIsHovered] = useState(false);

  // 2. Handlers
  const handleClick = useCallback(() => {
    onSelect?.(user);
  }, [onSelect, user]);

  // 3. Render helpers (se necessário)
  const renderBadge = () => {
    if (!user.isPremium) return null;
    return <Badge variant="premium">Premium</Badge>;
  };

  // 4. Return JSX
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        variant === 'compact' && 'p-2'
      )}
      onClick={handleClick}
    >
      <h3>{user.name}</h3>
      {renderBadge()}
    </div>
  );
};
```

### 4.2 Custom Hooks

```tsx
// ✅ Estrutura padrão de hook
import { useState, useEffect, useCallback } from 'react';

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Setup subscription
    const unsubscribe = authService.onAuthChange(setUser);
    setIsLoading(false);
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(credentials);
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return { user, isLoading, error, login, logout };
}
```

### 4.3 Services

```tsx
// ✅ Estrutura padrão de service
import { z } from 'zod';
import { db } from '@/lib/firebase';

// Schema de validação
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['user', 'admin']),
});

type User = z.infer<typeof UserSchema>;

export const userService = {
  async getById(id: string): Promise<User | null> {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;

    const data = doc.data();
    return UserSchema.parse({ id: doc.id, ...data });
  },

  async create(input: Omit<User, 'id'>): Promise<User> {
    // Valida input
    const validated = UserSchema.omit({ id: true }).parse(input);

    // Cria documento
    const ref = await db.collection('users').add({
      ...validated,
      createdAt: new Date(),
    });

    return { id: ref.id, ...validated };
  },

  async update(id: string, input: Partial<User>): Promise<void> {
    const validated = UserSchema.partial().parse(input);
    await db.collection('users').doc(id).update({
      ...validated,
      updatedAt: new Date(),
    });
  },
};
```

---

## 5. Validação de Dados

### 5.1 Regra Geral

> **TODA entrada externa DEVE ser validada antes de processamento.**

Entradas externas incluem:
- Dados de formulários
- Query parameters
- Request bodies
- Dados de APIs externas
- Dados do localStorage/sessionStorage

### 5.2 Biblioteca Padrão: Zod

```typescript
import { z } from 'zod';

// Schema de validação
const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(2).max(100),
  age: z.number().int().positive().optional(),
});

// Uso em API route
export async function POST(request: Request) {
  const body = await request.json();

  // Validação
  const result = CreateUserSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  // result.data é tipado e validado
  const user = await userService.create(result.data);
  return Response.json(user, { status: 201 });
}
```

### 5.3 Validação em Formulários

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof formSchema>;

function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormData) => {
    // data já está validado e tipado
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... */}
    </form>
  );
}
```

---

## 6. Tratamento de Erros

### 6.1 Estrutura de Erro Padrão

```typescript
// types/errors.ts
interface AppError {
  code: string;           // Ex: 'AUTH_001', 'DB_002'
  message: string;        // Mensagem técnica (para logs/devs)
  userMessage: string;    // Mensagem amigável (para UI)
  details?: unknown;      // Dados adicionais
  stack?: string;         // Stack trace (apenas em dev)
}

// Códigos de erro por categoria
const ErrorCodes = {
  // Autenticação (AUTH_XXX)
  AUTH_001: 'Token expirado',
  AUTH_002: 'Credenciais inválidas',
  AUTH_003: 'Permissão negada',

  // Database (DB_XXX)
  DB_001: 'Registro não encontrado',
  DB_002: 'Violação de constraint',

  // Validação (VAL_XXX)
  VAL_001: 'Dados inválidos',
  VAL_002: 'Campo obrigatório',

  // External (EXT_XXX)
  EXT_001: 'API externa indisponível',
  EXT_002: 'Rate limit atingido',
} as const;
```

### 6.2 Lançando Erros

```typescript
// ✅ Correto
throw new AppError({
  code: 'AUTH_001',
  message: 'JWT token expired at 2024-01-15T10:30:00Z',
  userMessage: 'Sua sessão expirou. Por favor, faça login novamente.',
});

// ❌ Evitar
throw new Error('Token expired');  // Sem contexto
throw 'Something went wrong';      // Nunca throw string
```

### 6.3 Capturando Erros

```typescript
// Em services
async function fetchUser(id: string) {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new AppError({
          code: 'DB_001',
          message: `User ${id} not found`,
          userMessage: 'Usuário não encontrado',
        });
      }
    }
    // Re-throw erros desconhecidos
    throw error;
  }
}
```

---

## 7. Segurança

### 7.1 Princípio Fundamental

> **NUNCA confie no cliente. Valide TUDO no servidor.**

### 7.2 Checklist de Segurança

- [ ] Validar TODOS os inputs no backend
- [ ] Usar prepared statements/parameterized queries
- [ ] Sanitizar outputs (XSS)
- [ ] Implementar rate limiting
- [ ] Usar HTTPS em produção
- [ ] Não expor stack traces em produção
- [ ] Não logar dados sensíveis
- [ ] Usar variáveis de ambiente para secrets

### 7.3 Dados Sensíveis

| Dado | Tratamento |
|------|------------|
| Senhas | NUNCA armazenar em plain text. Usar bcrypt/argon2 |
| Tokens de API | Variáveis de ambiente. NUNCA no código |
| PII (emails, CPF) | Mascarar em logs: `j***@email.com` |
| Cartões de crédito | Usar tokenização. NUNCA armazenar completo |

### 7.4 Autenticação

```typescript
// ✅ Verificar auth em TODA rota protegida
export async function GET(request: Request) {
  const session = await getSession(request);

  if (!session?.user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verificar permissões específicas
  if (!hasPermission(session.user, 'read:users')) {
    return Response.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Continuar...
}
```

---

## 8. Git Workflow

### 8.1 Branches

| Branch | Propósito | Proteção |
|--------|-----------|----------|
| `main` | Produção | Protected, require PR |
| `develop` | Staging/Preview | Protected |
| `feature/*` | Novas features | - |
| `fix/*` | Bug fixes | - |
| `hotfix/*` | Fixes urgentes em prod | Merge direto em main |

### 8.2 Nomenclatura de Branch

```
feature/STORY-1.1-user-authentication
fix/ISSUE-123-login-redirect-bug
hotfix/critical-payment-error
chore/update-dependencies
docs/add-api-documentation
```

### 8.3 Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
| Type | Descrição |
|------|-----------|
| `feat` | Nova feature |
| `fix` | Bug fix |
| `docs` | Documentação |
| `style` | Formatação (não afeta código) |
| `refactor` | Refatoração |
| `test` | Adição/modificação de testes |
| `chore` | Tarefas de manutenção |
| `perf` | Melhorias de performance |

**Exemplos:**
```
feat(auth): add Google OAuth login
fix(dashboard): correct chart rendering on mobile
docs(readme): update installation instructions
refactor(api): extract validation middleware
test(users): add unit tests for UserService
chore(deps): update react to v18.3
```

### 8.4 Pre-commit Hooks

```bash
# .husky/pre-commit
npm run lint
npm run type-check
npm run test:changed
```

---

## 9. Testes

### 9.1 Estratégia

| Tipo | Cobertura | Ferramentas |
|------|-----------|-------------|
| Unit | 80%+ de funções/hooks | Jest/Vitest |
| Integration | Fluxos críticos | Testing Library |
| E2E | Happy paths principais | Playwright/Cypress |

### 9.2 Estrutura de Teste

```typescript
// UserCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  it('renders user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<UserCard user={mockUser} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('article'));

    expect(onSelect).toHaveBeenCalledWith(mockUser);
  });

  describe('when user is premium', () => {
    it('shows premium badge', () => {
      render(<UserCard user={{ ...mockUser, isPremium: true }} />);
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });
});
```

### 9.3 Convenções

- Arquivos de teste: `*.test.ts` ou `*.spec.ts`
- Localização: junto ao arquivo ou em `__tests__/`
- Nomenclatura: descreva o comportamento, não a implementação

```typescript
// ✅ Bom
it('shows error message when email is invalid')
it('disables submit button while loading')

// ❌ Ruim
it('sets error state to true')
it('calls setIsLoading(true)')
```

---

## 10. Ambiente de Desenvolvimento

### 10.1 Variáveis de Ambiente

```bash
# .env.local (NUNCA commitar)
DATABASE_URL=postgresql://...
API_SECRET_KEY=sk-...
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# .env.example (commitar - template)
DATABASE_URL=postgresql://user:pass@localhost:5432/db
API_SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Regras:**
- Prefixo `NEXT_PUBLIC_` para variáveis expostas ao cliente
- NUNCA commitar `.env.local` ou `.env.production`
- SEMPRE manter `.env.example` atualizado

### 10.2 Scripts NPM

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "e2e": "playwright test",
    "validate": "npm run lint && npm run type-check && npm run test"
  }
}
```

---

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| {YYYY-MM-DD} | 1.0 | Documento inicial |
```

---

## Pós-Execução

```markdown
## 📋 Project Context Criado!

**Arquivo:** `docs/PROJECT-CONTEXT.md`

### O que foi documentado:
- Stack técnica e versões
- Estrutura de diretórios
- Convenções de nomenclatura
- Padrões de código (componentes, hooks, services)
- Validação de dados
- Tratamento de erros
- Regras de segurança
- Git workflow
- Estratégia de testes
- Ambiente de desenvolvimento

### Próximos Passos:
1. Revisar e ajustar conforme preferências do time
2. Compartilhar com todos os desenvolvedores
3. Configurar linters/formatters para enforcement automático
4. Adicionar ao onboarding de novos membros
```
