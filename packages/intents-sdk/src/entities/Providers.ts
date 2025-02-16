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
import { IconService, HttpProvider, Wallet as IconWallet } from 'icon-sdk-js';
import type { AddressOrPrivateKeyInit, ChainName, ChainType, HttpPrefixedUrl, IconEoaAddress } from '../types.js';
import { getEvmViemChain } from '../constants.js';
import {
  isEvmInitializedConfig,
  isEvmUninitializedConfig,
  isIconInitializedConfig,
  isIconUninitializedConfig,
  isPrivateKeyInit,
} from '../guards.js';
import { IconWalletProvider } from '../libs/IconWalletProvider.js';

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

export type IconUninitializedConfig = {
  iconRpcUrl: HttpPrefixedUrl;
  iconDebugRpcUrl: HttpPrefixedUrl;
  wallet: AddressOrPrivateKeyInit<string, IconEoaAddress>;
};

export type IconInitializedConfig = {
  iconService: IconService; // provide IconService instance or provider url
  iconDebugRpcUrl: HttpPrefixedUrl;
  http: HttpProvider;
  wallet: IconWallet | IconEoaAddress;
};

export class IconProvider {
  public readonly wallet: IconWalletProvider;

  constructor(payload: IconInitializedConfig | IconUninitializedConfig) {
    if (isIconUninitializedConfig(payload)) {
      this.wallet = new IconWalletProvider(
        isPrivateKeyInit(payload.wallet)
          ? IconWallet.loadPrivateKey(payload.wallet.privateKey)
          : payload.wallet.address,
        new IconService(new HttpProvider(payload.iconRpcUrl)),
        payload.iconDebugRpcUrl,
      );
    } else if (isIconInitializedConfig(payload)) {
      this.wallet = new IconWalletProvider(payload.wallet, payload.iconService, payload.iconDebugRpcUrl);
    } else {
      throw new Error('Invalid configuration payload passed to IconProvider');
    }
  }
}

export type ChainProviderType = EvmProvider | SuiProvider | IconProvider;

export type ChainProvider<T extends ChainType | undefined = undefined> = T extends 'evm'
  ? EvmProvider
  : T extends 'sui'
    ? SuiProvider
    : T extends 'icon'
      ? IconProvider
      : never;

export type GetChainProviderType<T extends ChainName> = T extends 'arb' | 'pol'
  ? ChainProvider<'evm'>
  : T extends 'sui'
    ? ChainProvider<'sui'>
    : T extends 'icon'
      ? ChainProvider<'icon'>
      : never;

export type NonEmptyChainProviders = [ChainProvider, ...ChainProvider[]];
