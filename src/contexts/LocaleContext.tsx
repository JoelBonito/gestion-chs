import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

type Locale = 'pt-PT' | 'fr-FR';

interface LocaleContextType {
  locale: Locale;
  isRestrictedFR: boolean;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'pt-PT',
  isRestrictedFR: false,
});

export const useLocale = () => useContext(LocaleContext);

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const { user } = useAuth();
  const { hasRole } = useUserRole();

  // Check if user is restricted FR user
  const isRestrictedFR = hasRole('restricted_fr' as any) || user?.id === 'aea47216-874e-49cf-a392-5aedad7f3962';
  const locale: Locale = isRestrictedFR ? 'fr-FR' : 'pt-PT';



  return (
    <LocaleContext.Provider value={{ locale, isRestrictedFR }}>
      {children}
    </LocaleContext.Provider>
  );
}