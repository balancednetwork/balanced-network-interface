import { stellar } from '@/xwagmi/constants/xChains';
import { XService } from '@/xwagmi/core/XService';
import { FREIGHTER_ID, StellarWalletsKit, WalletNetwork, allowAllModules } from '@creit.tech/stellar-wallets-kit';
import * as StellarSdk from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/lib/horizon';

export class StellarXService extends XService {
  private static instance: StellarXService;

  public walletsKit: StellarWalletsKit;
  public server: Server;

  private constructor() {
    super('STELLAR');

    this.walletsKit = new StellarWalletsKit({
      network: WalletNetwork.PUBLIC,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });

    this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
  }

  public static getInstance(): StellarXService {
    if (!StellarXService.instance) {
      StellarXService.instance = new StellarXService();
    }
    return StellarXService.instance;
  }
}
