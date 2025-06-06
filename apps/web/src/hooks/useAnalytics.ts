import { useCallback } from 'react';
import { usePlausible } from '../providers/PlausibleProvider';
import { AnalyticsEventName } from '../utils/analytics';

export const useAnalytics = () => {
  const { plausible } = usePlausible();

  const track = useCallback(
    (eventName: AnalyticsEventName, props?: Record<string, any>) => {
      plausible.trackEvent(eventName, { props });
    },
    [plausible],
  );

  return { track };
};
