import Plausible from 'plausible-tracker';

// Common event names
export const AnalyticsEvents = {
  // Swap events
  SWAP: 'swap_standard',
  SWAP_INTENT: 'swap_intent',
  SWAP_FAILED: 'swap_standard_failed',
  SWAP_INTENT_FAILED: 'swap_intent_failed',

  //Bridge events
  BRIDGE_INITIATED: 'bridge',
  BRIDGE_FAILED: 'bridge_failed',

  //Loan events
  BORROW: 'borrow',
  REPAY: 'repay',
  COLLATERAL_DEPOSIT: 'collateral_deposit',
  COLLATERAL_WITHDRAWAL: 'collateral_withdrawal',

  //Wallet events
  WALLET_CONNECTED: 'wallet_connected',

  // Other events
  ERROR_OCCURRED: 'error_occurred',
} as const;

// Type for event names
export type AnalyticsEventName = keyof typeof AnalyticsEvents;

// Type for Plausible instance
export type PlausibleInstance = ReturnType<typeof Plausible>;

// Create a context for the Plausible instance
export const createPlausibleInstance = (domain: string) => {
  return Plausible({
    domain,
    trackLocalhost: true,
  });
};
