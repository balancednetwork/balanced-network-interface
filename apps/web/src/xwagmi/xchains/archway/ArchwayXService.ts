import { XService } from '@/xwagmi/core/XService';
import { ArchwayClient } from '@archwayhq/arch3.js';
import { XSigningArchwayClient } from './XSigningArchwayClient';

export class ArchwayXService extends XService {
  private static instance: ArchwayXService;

  public rpcURL: string = 'https://rpc.mainnet.archway.io';
  public chainId: string = 'archway-1';
  public publicClient: ArchwayClient | null = null;
  public walletClient: XSigningArchwayClient | null = null;

  private constructor() {
    super('ARCHWAY');
  }

  public async init() {
    this.publicClient = await ArchwayClient.connect(this.rpcURL);
  }

  public setWalletClient(walletClient: XSigningArchwayClient | null) {
    this.walletClient = walletClient;
  }

  public static getInstance(): ArchwayXService {
    if (!ArchwayXService.instance) {
      ArchwayXService.instance = new ArchwayXService();
    }
    return ArchwayXService.instance;
  }
}
