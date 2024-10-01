import React, { ReactNode, useEffect } from 'react';

import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';

import { DEFAULT_CATALOG, DEFAULT_LOCALE, SupportedLocale } from '@/constants/locales';

export async function dynamicActivate(locale: SupportedLocale) {
  // There are no default messages in production; instead, bundle the default to save a network request:
  // see https://github.com/lingui/js-lingui/issues/388#issuecomment-497779030
  const catalog = locale === DEFAULT_LOCALE ? DEFAULT_CATALOG : await import(`../locales/${locale}.po`);
  // Bundlers will either export it as default or as a named export named default.
  i18n.load(locale, catalog.messages);
  i18n.activate(locale);
  // load dayjs locale
  const languageCode = locale.split('-')[0];
  // await import(`dayjs/locale/${languageCode}.js`);
}

interface ProviderProps {
  locale: SupportedLocale;
  onActivate?: (locale: SupportedLocale) => void;
  children: ReactNode;
}

export function Provider({ locale, onActivate, children }: ProviderProps) {
  useEffect(() => {
    dynamicActivate(locale)
      .then(() => onActivate?.(locale))
      .catch(error => {
        console.error('Failed to activate locale', locale, error);
      });
  }, [locale, onActivate]);

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>;
}
