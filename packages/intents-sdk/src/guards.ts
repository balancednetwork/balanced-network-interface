import type {
  ChainConfig,
  EvmChainConfig,
  IconAddress,
  IconChainConfig,
  SuiChainConfig,
  PrivateKeyHolder,
  WalletAddressHolder,
  IconTransactionEventLogs,
  IconEventLog,
} from './types.js';
import type {
  EvmInitializedConfig,
  EvmUninitializedConfig,
  IconInitializedConfig,
  IconUninitializedConfig,
} from './entities/index.js';
import type { JsonRpcPayloadResponse, ResponseAddressType, ResponseSigningType } from './libs/index.js';

export function isEvmChainConfig(value: ChainConfig): value is EvmChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
}

export function isSuiChainConfig(value: ChainConfig): value is SuiChainConfig {
  return typeof value === 'object' && value.chain.type === 'sui';
}

export function isIconChainConfig(value: ChainConfig): value is IconChainConfig {
  return typeof value === 'object' && value.chain.type === 'icon';
}

export function isEvmUninitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmUninitializedConfig {
  return typeof value === 'object' && 'userAddress' in value && 'chain' in value;
}

export function isEvmInitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmInitializedConfig {
  return typeof value === 'object' && 'walletClient' in value && 'publicClient' in value;
}

export function isIconUninitializedConfig(
  value: IconUninitializedConfig | IconInitializedConfig,
): value is IconUninitializedConfig {
  return typeof value === 'object' && 'iconRpcUrl' in value;
}

export function isIconInitializedConfig(
  value: IconUninitializedConfig | IconInitializedConfig,
): value is IconInitializedConfig {
  return typeof value === 'object' && 'iconService' in value;
}

export function isIconAddress(value: unknown): value is IconAddress {
  return typeof value === 'string' && /^hx[a-f0-9]{40}$|^cx[a-f0-9]{40}$/.test(value);
}
export function isResponseAddressType(value: unknown): value is ResponseAddressType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_ADDRESS' &&
    isIconAddress(value.payload)
  );
}

export function isResponseSigningType(value: unknown): value is ResponseSigningType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'payload' in value &&
    value.type === 'RESPONSE_SIGNING' &&
    typeof value.payload === 'string'
  );
}

export function isJsonRpcPayloadResponse(value: unknown): value is JsonRpcPayloadResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'result' in value &&
    typeof value.result === 'string'
  );
}

export function isPrivateKeyInit(value: unknown): value is PrivateKeyHolder {
  return typeof value === 'object' && value !== null && 'privateKey' in value;
}

export function isAddressInit(value: unknown): value is WalletAddressHolder {
  return typeof value === 'object' && value !== null && 'address' in value;
}

export function isIconEventLog(value: unknown): value is IconEventLog {
  return (
    typeof value === 'object' &&
    value !== null &&
    'indexed' in value &&
    'data' in value &&
    Array.isArray(value.indexed) &&
    Array.isArray(value.data)
  );
}

export function isIconTransactionEventLogs(value: unknown): value is IconTransactionEventLogs {
  return typeof value === 'object' && value !== null && 'eventLogs' in value && Array.isArray(value.eventLogs);
}
