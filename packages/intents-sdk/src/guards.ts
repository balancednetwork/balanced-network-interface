import type { ChainConfig, EvmChainConfig, SuiChainConfig } from './types.js';
import type { EvmInitializedConfig, EvmUninitializedConfig } from './entities/index.js';

export function isEvmChainConfig(value: ChainConfig): value is EvmChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
}

export function isSuiChainConfig(value: ChainConfig): value is SuiChainConfig {
  return typeof value === 'object' && value.chain.type === 'sui';
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
