import type { LinguiConfig } from '@lingui/conf';

const linguiConfig: LinguiConfig = {
  catalogs: [
    {
      path: '<rootDir>/src/locales/{locale}',
      include: ['<rootDir>/src'],
    },
  ],
  // compileNamespace: 'cjs',
  fallbackLocales: {
    default: 'en-US',
  },
  format: 'po',
  formatOptions: {
    lineNumbers: false,
  },
  locales: ['en-US', 'es-ES', 'fr-FR', 'ko-KR', 'nl-NL', 'pl-PL', 'vi-VN', 'pseudo'],
  orderBy: 'messageId',
  rootDir: '.',
  runtimeConfigModule: ['@lingui/core', 'i18n'],
  sourceLocale: 'en-US',
  pseudoLocale: 'pseudo',
};

export default linguiConfig;
