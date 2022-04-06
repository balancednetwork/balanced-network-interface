import React, { ReactNode, useCallback } from 'react';

import { SupportedLocale } from 'constants/locales';
import { initialLocale, useActiveLocale } from 'hooks/useActiveLocale';
import { useUserLocaleManager } from 'store/user/hooks';

import { dynamicActivate, Provider } from './lib/i18n';

dynamicActivate(initialLocale);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useActiveLocale();
  const [, setUserLocale] = useUserLocaleManager();

  const onActivate = useCallback(
    (locale: SupportedLocale) => {
      document.documentElement.setAttribute('lang', locale);
      setUserLocale(locale); // stores the selected locale to persist across sessions
    },
    [setUserLocale],
  );

  return (
    <Provider locale={locale} forceRenderAfterLocaleChange={true} onActivate={onActivate}>
      {children}
    </Provider>
  );
}
