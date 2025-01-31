import { describe, it, expect } from 'vitest';
import { EvmProvider, IconProvider, SuiProvider } from '../entities/index.js';
import { IconService, HttpProvider } from 'icon-sdk-js';

describe('Providers', () => {
  describe('EvmProvider', () => {
    it('should initialize with uninitialized config', () => {
      const provider = new EvmProvider({
        userAddress: '0x601020c5797Cdd34f64476b9bf887a353150Cb9a' as any,
        chain: 'arb',
        provider: { request: async () => ({}) },
      });

      expect(provider.walletClient).toBeDefined();
      expect(provider.publicClient).toBeDefined();
    });

    it('should initialize with uninitialized config', () => {
      const provider = new EvmProvider({
        userAddress: '0x601020c5797Cdd34f64476b9bf887a353150Cb9a' as any,
        chain: 'arb',
        provider: { request: async () => ({}) },
      });

      expect(provider.walletClient).toBeDefined();
      expect(provider.publicClient).toBeDefined();
    });

    it('should throw error on invalid config', () => {
      expect(() => new EvmProvider({} as any)).toThrow('Invalid configuration');
    });
  });

  describe('IconProvider', () => {
    it('should initialize with uninitialized config using address', () => {
      const provider = new IconProvider({
        iconRpcUrl: 'https://ctz.solidwallet.io/api/v3',
        iconDebugRpcUrl: 'https://ctz.solidwallet.io/api/v3d',
        wallet: {
          address: 'hx601020c5797Cdd34f64476b9bf887a353150Cb9a',
        },
      });

      expect(provider.wallet).toBeDefined();
      expect(provider.wallet.getAddress()).toBe('hx601020c5797Cdd34f64476b9bf887a353150Cb9a');
    });

    it('should initialize with uninitialized config using private key and throw error', () => {
      expect(
        () =>
          new IconProvider({
            iconRpcUrl: 'https://ctz.solidwallet.io/api/v3',
            iconDebugRpcUrl: 'https://ctz.solidwallet.io/api/v3d',
            wallet: {
              privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
          }),
      ).toThrow('not a valid private key');
    });

    it('should initialize with initialized config', () => {
      const httpProvider = new HttpProvider('https://ctz.solidwallet.io/api/v3');
      const provider = new IconProvider({
        iconService: new IconService(httpProvider),
        iconDebugRpcUrl: 'https://ctz.solidwallet.io/api/v3d',
        http: httpProvider,
        wallet: 'hx601020c5797Cdd34f64476b9bf887a353150Cb9a',
      });

      expect(provider.wallet).toBeDefined();
      expect(provider.wallet.getAddress()).toBe('hx601020c5797Cdd34f64476b9bf887a353150Cb9a');
    });

    it('should throw error on invalid config', () => {
      expect(() => new IconProvider({} as any)).toThrow('Invalid configuration');
    });
  });

  describe('SuiProvider', () => {
    const mockWallet = { name: 'MockWallet' };
    const mockAccount = { address: '0x123' };
    const mockClient = { getObject: async () => ({}) };

    it('should initialize with valid config', () => {
      const provider = new SuiProvider({
        wallet: mockWallet as any,
        account: mockAccount as any,
        client: mockClient as any,
      });

      expect(provider.wallet).toBe(mockWallet);
      expect(provider.account).toBe(mockAccount);
      expect(provider.client).toBe(mockClient);
    });

    it('should maintain provided references', () => {
      const config = {
        wallet: mockWallet as any,
        account: mockAccount as any,
        client: mockClient as any,
      };
      const provider = new SuiProvider(config);

      expect(provider.wallet).toBe(config.wallet);
      expect(provider.account).toBe(config.account);
      expect(provider.client).toBe(config.client);
    });
  });
});
