import type { Address } from 'viem';

export type ChainType = 'evm' | 'sui' | 'icon';
export type ChainName = 'sui' | 'arb' | 'pol' | 'icon';
export type ChainInfo<T extends ChainType> = {
  name: ChainName;
  type: T;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type IconAddress = `hx${string}` | `cx${string}`;
export type IconSmartContractAddress = `cx${string}`;
export type IconEoaAddress = `hx${string}`;

export enum IntentStatusCode {
  NOT_FOUND = -1,
  NOT_STARTED_YET = 1, // It's in the task pool, but not started yet
  STARTED_NOT_FINISHED = 2,
  SOLVED = 3,
  FAILED = 4,
}

export enum IntentErrorCode {
  NO_PATH_FOUND = -4, // No path to swap Token X to Token Y
  NO_PRIVATE_LIQUIDITY = -5, // Path found, but we have no private liquidity on the dest chain
  NOT_ENOUGH_PRIVATE_LIQUIDITY = -8, // Path found, but not enough private liquidity on the dst chain
  NO_EXECUTION_MODULE_FOUND = -7, // Path found, private liquidity, but execution modules unavailable
  QUOTE_NOT_FOUND = -8, // When executing, given quote_uuid does not exist
  CREATE_INTENT_ORDER_FAILED = -998,
  UNKNOWN = -999,
}

export type BaseChainConfig<T extends ChainType> = {
  chain: ChainInfo<T>;
  nid: string;
  supportedTokens: Token[];
};

export type EvmChainConfig = BaseChainConfig<'evm'> & {
  intentContract: Address;
  nativeToken: Address;
};

export type SuiChainConfig = BaseChainConfig<'sui'> & {
  packageId: string;
  storageId: string;
  nativeToken: string;
};

export type IconChainConfig = BaseChainConfig<'icon'> & {
  intentContract: IconSmartContractAddress;
  nativeToken: IconSmartContractAddress;
};

export type ChainConfig = EvmChainConfig | SuiChainConfig | IconChainConfig;

export type GetChainConfigType<T extends ChainName> = T extends 'sui'
  ? SuiChainConfig
  : T extends 'arb' | 'pol'
    ? EvmChainConfig
    : never;

export type Result<T, E = Error | unknown> = { ok: true; value: T } | { ok: false; error: E };

export type SuiNetworkType = 'mainnet' | 'testnet' | 'devnet' | 'localnet';

export type IntentQuoteRequest = {
  token_src: string;
  token_src_blockchain_id: string;
  token_dst: string;
  token_dst_blockchain_id: string;
  src_amount: bigint;
};

export type IntentQuoteResponseRaw = {
  output: {
    expected_output: string;
    uuid: string;
  };
};

export type IntentQuoteResponse = {
  output: {
    expected_output: bigint;
    uuid: string;
  };
};

export type IntentErrorResponse = {
  detail: {
    code: IntentErrorCode;
    message: string;
  };
};

export type IntentExecutionRequest = {
  intent_tx_hash: string;
  quote_uuid: string;
};

export type IntentExecutionResponse = {
  answer: 'OK';
  task_id: string;
};

export type IntentStatusRequest = {
  task_id: string;
};

export type IntentStatusResponse = {
  status: IntentStatusCode;
  tx_hash?: string; // defined only if status is 3
};

export type CreateIntentOrderPayload = {
  quote_uuid: string;
  fromAddress: string;
  toAddress: string;
  fromChain: ChainName;
  toChain: ChainName;
  token: string;
  amount: bigint; // amount in token decimal scale
  toToken: string;
  toAmount: bigint; // amount in token decimal scale
};

export type IntentServiceConfig = {
  solverApiEndpoint: string;
};

export type HttpPrefixedUrl = `http${string}`;

export type PrivateKeyHolder<T = string> = {
  privateKey: T;
};

export type WalletAddressHolder<T = string> = {
  address: T;
};

export type AddressOrPrivateKeyInit<PkType = string, AddressType = string> =
  | PrivateKeyHolder<PkType>
  | WalletAddressHolder<AddressType>;

export type IconEventLog = {
  indexed: string[];
  data: string[];
};

export type IconTransactionEventLogs = {
  eventLogs: IconEventLog[];
};
