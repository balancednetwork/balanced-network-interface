import { useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

export const useCoinGeckoAnalytics = () => {
  const { track } = useAnalytics();

  useEffect(() => {
    const handleRateLimitHit = (event: CustomEvent) => {
      const { from, to } = event.detail;
      track('coingecko_limit_hit', { from, to });
    };

    // Listen for CoinGecko rate limit events
    window.addEventListener('coingeckoRateLimitHit', handleRateLimitHit as EventListener);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('coingeckoRateLimitHit', handleRateLimitHit as EventListener);
    };
  }, [track]);
};
