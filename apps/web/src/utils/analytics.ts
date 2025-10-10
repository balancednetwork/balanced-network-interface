import Plausible from 'plausible-tracker';

export type AnalyticsEventName =
  | 'swap_standard'
  | 'swap_intent'
  | 'bridge'
  | 'borrow'
  | 'repay'
  | 'collateral_deposit'
  | 'collateral_withdrawal'
  | 'savings_deposit'
  | 'savings_withdrawal'
  | 'liquidity_deposit'
  | 'liquidity_withdrawal'
  | 'wallet_connected'
  | 'coingecko_limit_hit'
  | 'swap_intent_v2';

// Type for Plausible instance
export type PlausibleInstance = ReturnType<typeof Plausible>;

// Create a context for the Plausible instance
export const createPlausibleInstance = (domain: string) => {
  return Plausible({
    domain,
    apiHost: window.location.origin + '/api/analytics', // Use the proxy path for analytics
  });
};
