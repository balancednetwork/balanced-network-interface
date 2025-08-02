import { XService } from '@/core/XService';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/lib/horizon';
import CustomSorobanServer from './CustomSorobanServer';

// Use type-only import to avoid side effects
import type { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

let globalWalletsKitInstance: StellarWalletsKit | null = null;

export class StellarXService extends XService {
  private static instance: StellarXService;

  public walletsKit!: StellarWalletsKit;
  public server: Server;
  public sorobanServer: CustomSorobanServer;

  private constructor() {
    super('STELLAR');

    this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org', { allowHttp: true });
    this.sorobanServer = new CustomSorobanServer('https://rpc.ankr.com/stellar_soroban', {});

    // Initialize walletsKit asynchronously to avoid custom element registration on import
    this.initializeWalletsKit();
  }

  private async initializeWalletsKit() {
    if (globalWalletsKitInstance) {
      this.walletsKit = globalWalletsKitInstance;
      return;
    }

    try {
      // Dynamic import to avoid custom element registration during module import
      const { StellarWalletsKit, WalletNetwork, allowAllModules, FREIGHTER_ID } = await import(
        '@creit.tech/stellar-wallets-kit'
      );

      this.walletsKit = new StellarWalletsKit({
        network: WalletNetwork.PUBLIC,
        selectedWalletId: FREIGHTER_ID,
        modules: allowAllModules(),
      });

      globalWalletsKitInstance = this.walletsKit;
    } catch (error) {
      console.error('Failed to initialize StellarWalletsKit:', error);
      // Create a minimal fallback to prevent complete failure
      this.walletsKit = {} as StellarWalletsKit;
    }
  }

  // Ensure walletsKit is initialized before use
  public async ensureWalletsKitReady(): Promise<StellarWalletsKit> {
    if (!this.walletsKit || Object.keys(this.walletsKit).length === 0) {
      await this.initializeWalletsKit();
    }
    return this.walletsKit;
  }

  public static getInstance(): StellarXService {
    if (!StellarXService.instance) {
      StellarXService.instance = new StellarXService();
    }
    return StellarXService.instance;
  }
}
