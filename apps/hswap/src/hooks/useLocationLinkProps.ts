import { useMemo } from 'react';

import { stringify } from 'qs';
// import ReactGA from 'react-ga';
import { useLocation } from 'react-router-dom';

import { SupportedLocale } from '@/constants/locales';
import useParsedQueryString from '@/hooks/useParsedQueryString';

// import { useActiveLocale } from './useActiveLocale';

export function useLocationLinkProps(locale: SupportedLocale | null): {
  to?: any;
  onClick?: () => void;
} {
  const location = useLocation();
  const qs = useParsedQueryString();
  // const activeLocale = useActiveLocale();

  return useMemo(
    () =>
      !locale
        ? {}
        : {
            to: {
              ...location,
              search: stringify({ ...qs, lng: locale }),
            },
            onClick: () => {
              // ReactGA.event({
              //   category: 'Localization',
              //   action: 'Switch Locale',
              //   label: `${activeLocale} -> ${locale}`,
              // });
            },
          },
    [location, qs, locale /* activeLocale */],
  );
}
