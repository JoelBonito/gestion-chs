---
description: Implementação de sistema de internacionalização (i18n) em projetos React
---

# 🌐 Workflow: Implementação de i18n

Este workflow guia a implementação completa de internacionalização em um projeto React com Vite.

> **Base de Conhecimento:** `~/.gemini/knowledge_base/09_I18N.md`  
> **Lei Relacionada:** Lei VII (Internacionalização) - `01_GOVERNANCE_PRIME.md`  
> **Frontend:** `~/.gemini/knowledge_base/04_FRONTEND.md`  
> **Stack:** i18next + react-i18next + i18next-browser-languagedetector

---

## 📋 Pré-requisitos

- Projeto React (Vite) configurado
- TypeScript habilitado
- Definição dos idiomas a suportar
- Verificar existência e atualização de `docs/PLAN.md` (Lei #3: Architect First).
  - Se não existir ou estiver desatualizado, bloquear a continuação e solicitar criação do plano.
  - Caso esteja OK, prosseguir.

---

## 🚀 Etapas de Implementação

### Etapa 1: Instalação de Dependências

// turbo
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Etapa 2: Criar Estrutura de Pastas

// turbo
```bash
mkdir -p src/locales src/lib src/contexts
```

### Etapa 3: Criar Arquivo de Configuração i18n

Criar `src/lib/i18n.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from '../locales/pt.json';
import en from '../locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  });

export default i18n;
```

### Etapa 4: Criar Utilitários de Idioma

Criar `src/lib/languageUtils.ts`:

```typescript
type Language = "pt" | "en" | "es";

const SUPPORTED_LANGUAGES: Language[] = ["pt", "en", "es"];
const FALLBACK_LANGUAGE: Language = "en";

export function detectBrowserLanguage(): Language {
  const browserLanguages = navigator.languages || [navigator.language];

  for (const browserLang of browserLanguages) {
    const normalizedLang = browserLang.toLowerCase();

    if (SUPPORTED_LANGUAGES.includes(normalizedLang as Language)) {
      return normalizedLang as Language;
    }

    if (normalizedLang.startsWith('pt')) return 'pt';

    const primaryLang = normalizedLang.split('-')[0];
    if (SUPPORTED_LANGUAGES.includes(primaryLang as Language)) {
      return primaryLang as Language;
    }
  }

  return FALLBACK_LANGUAGE;
}

export function getInitialLanguage(): Language {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
    return savedLanguage as Language;
  }
  return detectBrowserLanguage();
}

export type { Language };
export { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE };
```

### Etapa 5: Criar Context de Idioma

Criar `src/contexts/LanguageContext.tsx`:

```typescript
import { createContext, useContext, useState, ReactNode } from "react";
import i18n from "../lib/i18n";
import { getInitialLanguage, Language } from "../lib/languageUtils";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  getLanguageName: (lang: Language) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_NAMES: Record<Language, string> = {
  "pt": "Português (Brasil)",
  "en": "English",
  "es": "Español",
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const initialLang = getInitialLanguage();
    i18n.changeLanguage(initialLang);
    return initialLang;
  });
  const [isLoading, setIsLoading] = useState(false);

  const setLanguage = async (newLanguage: Language) => {
    setIsLoading(true);
    setLanguageState(newLanguage);
    await i18n.changeLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    setIsLoading(false);
  };

  const getLanguageName = (lang: Language) => LANGUAGE_NAMES[lang] || lang;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, getLanguageName, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
```

### Etapa 6: Criar Arquivos de Tradução Base

Criar `src/locales/pt.json`:

```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "loading": "Carregando...",
    "error": "Erro",
    "success": "Sucesso"
  },
  "auth": {
    "welcome": "Bem-vindo",
    "login": "Entrar",
    "logout": "Sair"
  },
  "toasts": {
    "saved": "Salvo com sucesso!",
    "deleted": "Excluído com sucesso!",
    "error": "Algo deu errado. Tente novamente."
  }
}
```

Criar `src/locales/en.json`:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "auth": {
    "welcome": "Welcome",
    "login": "Login",
    "logout": "Logout"
  },
  "toasts": {
    "saved": "Saved successfully!",
    "deleted": "Deleted successfully!",
    "error": "Something went wrong. Try again."
  }
}
```

### Etapa 7: Importar i18n no Entry Point

Atualizar `src/main.tsx`:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/i18n'; // Importar configuração i18n
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Etapa 8: Envolver App com LanguageProvider

Atualizar `src/App.tsx`:

```typescript
import { LanguageProvider } from './contexts/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      {/* Resto da aplicação */}
    </LanguageProvider>
  );
}
```

### Etapa 9: Criar Script de Auditoria

Criar `scripts/check-i18n-keys.js`:

```javascript
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
const allData = {};

files.forEach(file => {
  const lang = file.replace('.json', '');
  const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  allData[lang] = new Set(getAllKeys(content));
});

const baseKeys = allData['pt'] || allData['en'];

console.log('=== AUDITORIA DE CHAVES i18n ===\n');

let hasErrors = false;

Object.keys(allData).forEach(lang => {
  const langKeys = allData[lang];
  const missing = [...baseKeys].filter(k => !langKeys.has(k));
  
  if (missing.length > 0) {
    hasErrors = true;
    console.log(`[${lang.toUpperCase()}] ❌ ${missing.length} chaves faltando:`);
    missing.forEach(k => console.log(`  - ${k}`));
  } else {
    console.log(`[${lang.toUpperCase()}] ✓ Completo`);
  }
});

if (hasErrors) {
  process.exit(1);
}
```

### Etapa 10: Adicionar Script ao package.json

Adicionar em `package.json`:

```json
{
  "scripts": {
    "i18n:check": "node scripts/check-i18n-keys.js"
  }
}
```

### Etapa 11: Executar Validação

// turbo
```bash
npm run i18n:check
```

---

## ✅ Verificação Final

- [ ] Dependências instaladas
- [ ] Arquivos de configuração criados
- [ ] Arquivos de tradução sincronizados
- [ ] Context configurado e envolvendo App
- [ ] Script de auditoria funcionando
- [ ] Importação de i18n no entry point

---

## 📝 Uso nos Componentes

Após implementação:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <Button>{t('common.save')}</Button>;
}
```

---

## 📚 Referência

Consulte `~/.gemini/knowledge_base/09_I18N.md` para documentação completa.
