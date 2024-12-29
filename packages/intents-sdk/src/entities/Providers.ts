import {
  type Account,
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  type CustomTransport,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { type Wallet, type WalletAccount } from '@mysten/wallet-standard';
import { SuiClient } from '@mysten/sui/client';
import type { ChainName, ChainType } from '../types.js';
import { getEvmViemChain } from '../constants.js';
import { isEvmInitializedConfig, isEvmUninitializedConfig } from '../guards.js';

export type CustomProvider = { request(...args: any): Promise<any> };

export type EvmUninitializedConfig = {
  userAddress: Address;
  chain: ChainName;
  provider: CustomProvider;
};

export type EvmInitializedConfig = {
  walletClient: WalletClient<CustomTransport, Chain, Account>;
  publicClient: PublicClient<CustomTransport>;
};

export class EvmProvider {
  public readonly walletClient: WalletClient<CustomTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport>;

  constructor(payload: EvmUninitializedConfig | EvmInitializedConfig) {
    if (isEvmUninitializedConfig(payload)) {
      this.walletClient = createWalletClient({
        account: payload.userAddress,
        transport: custom(payload.provider),
        chain: getEvmViemChain(payload.chain),
      });
      this.publicClient = createPublicClient({
        transport: custom(payload.provider),
        chain: getEvmViemChain(payload.chain),
      });
    } else if (isEvmInitializedConfig(payload)) {
      this.walletClient = payload.walletClient;
      this.publicClient = payload.publicClient;
    } else {
      throw new Error('Invalid configuration payload passed to EvmProvider');
    }
  }
}

export type SuiInitializedConfig = {
  wallet: Wallet;
  account: WalletAccount;
  client: SuiClient;
};

export class SuiProvider {
  public readonly wallet: Wallet;
  public readonly account: WalletAccount;
  public readonly client: SuiClient;

  constructor(payload: SuiInitializedConfig) {
    this.wallet = payload.wallet;
    this.account = payload.account;
    this.client = payload.client;
  }
}

export type ChainProviderType = EvmProvider | SuiProvider;

export type ChainProvider<T extends ChainType | undefined = undefined> = T extends 'evm'
  ? EvmProvider
  : T extends 'sui'
    ? SuiProvider
    : ChainProviderType;

export type GetChainProviderType<T extends ChainName> = T extends 'arb'
  ? ChainProvider<'evm'>
  : T extends 'sui'
    ? ChainProvider<'sui'>
    : never;

export type NonEmptyChainProviders = [ChainProvider, ...ChainProvider[]];
