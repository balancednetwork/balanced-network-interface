import Plausible from 'plausible-tracker';

export type AnalyticsEventName =
  | 'swap_standard'
  | 'swap_intent'
  | 'swap_standard_failed'
  | 'swap_intent_failed'
  | 'bridge'
  | 'bridge_failed'
  | 'borrow'
  | 'repay'
  | 'collateral_deposit'
  | 'collateral_withdrawal'
  | 'wallet_connected'
  | 'error_occurred';

// Type for Plausible instance
export type PlausibleInstance = ReturnType<typeof Plausible>;

// Create a context for the Plausible instance
export const createPlausibleInstance = (domain: string) => {
  return Plausible({
    domain,
    trackLocalhost: true,
    apiHost: 'https://plausible.io',
  });
};
