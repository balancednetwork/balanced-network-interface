import Plausible from 'plausible-tracker';

// Common event names
export const AnalyticsEvents = {
  // Swap events
  SWAP_INITIATED: 'swap_initiated',
  SWAP_COMPLETED: 'swap_completed',
  SWAP_FAILED: 'swap_failed',

  // Button clicks
  BUTTON_CLICK: 'button_click',

  // Navigation
  PAGE_VIEW: 'page_view',

  // Wallet events
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',

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
