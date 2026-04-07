import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlausible } from '../../providers/PlausibleProvider';

export const PageViewTracker = () => {
  const location = useLocation();
  const { plausible } = usePlausible();

  useEffect(() => {
    // Track page view on route change
    if (location) {
      plausible.trackPageview({
        url: window.location.href,
      });
    }
  }, [location, plausible]);

  return null;
};
