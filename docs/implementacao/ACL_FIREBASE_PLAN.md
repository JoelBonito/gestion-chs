# Plano de Implementação: Controle de Acessos (ACL) via Firebase

**Status**: 🏗️ Em Planejamento
**Data**: 2025-12-29
**Fonte**: [GEMS 5.0: 05_BACKEND.md → Firestore]

## 1. Objetivo
Centralizar o controle de acessos (Roles) no Firebase Firestore para eliminar a dependência de e-mails hardcoded no front-end e permitir uma gestão dinâmica de permissões.

## 2. Estrutura de Dados (Firestore)
Criar uma coleção `user_profiles` onde cada documento tem o ID do usuário (UID do Firebase Auth).

```typescript
// users/{uid}
{
  email: string,
  role: 'admin' | 'ops' | 'client' | 'factory' | 'finance' | 'restricted_fr' | 'collaborator',
  permissions: string[], // Opcional: para fine-grained control
  metadata: {
    name: string,
    factory_id?: string
  }
}
```

## 3. Etapas de Execução

### Fase 1: Setup Firebase (Se ainda não pronto)
- [ ] Instalar dependências: `npm install firebase`
- [ ] Criar `src/lib/firebase/config.ts`
- [ ] Configurar Firebase Auth & Firestore

### Fase 2: Migração de Lógica
- [ ] Criar `src/services/AccessControlService.ts` para ler roles do Firestore.
- [ ] Atualizar `UserRoleContext.tsx` para consumir dados do Firebase em vez do Supabase.
- [ ] Substituir `isHardcodedAdmin` por uma verificação no documento do Firestore.

### Fase 3: Substituição de Guards
- [ ] Refatorar `FelipeGuard` e `FactoryGuard` para usar o novo `AccessControlService`.
- [ ] Unificar as regras de `src/lib/permissions.ts` (Rosa) no Firestore.

## 4. Mapeamento Atual (Para Migração)
| Email | Role Atual (Hardcoded) | Destino Firestore |
| :--- | :--- | :--- |
| jbento1@gmail.com | Admin | `role: 'admin'` |
| admin@admin.com | Admin | `role: 'admin'` |
| ham@admin.com | Admin | `role: 'admin'` |
| felipe@colaborador.com | FelipeGuard (Redirect) | `role: 'collaborator', permissions: ['no_dashboard']` |
| rosa@colaborador.com | LimitedNav (No Prices) | `role: 'collaborator', permissions: ['no_prices']` |

## 5. Segurança (Security Rules)
Configurar regras no Firestore para que apenas o próprio usuário leia seu perfil, e apenas admins possam alterar.

---
[GEMS 5.0: 01_GOVERNANCE_PRIME.md]
