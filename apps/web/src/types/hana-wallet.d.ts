interface HanaWallet {
  stellar: any;
}

declare global {
  interface Window {
    hanaWallet?: HanaWallet;
    stellar?: any;
  }
}

export type { HanaWallet };
