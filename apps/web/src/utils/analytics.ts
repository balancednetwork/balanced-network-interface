import Plausible from 'plausible-tracker';

export type AnalyticsEventName =
  | 'testevent'
  | 'swap_standard'
  | 'swap_intent'
  | 'bridge'
  | 'borrow'
  | 'repay'
  | 'collateral_deposit'
  | 'collateral_withdrawal'
  | 'wallet_connected';

// Type for Plausible instance
export type PlausibleInstance = ReturnType<typeof Plausible>;

// Create a context for the Plausible instance
export const createPlausibleInstance = (domain: string) => {
  return Plausible({
    domain,
    trackLocalhost: true,
  });
};
