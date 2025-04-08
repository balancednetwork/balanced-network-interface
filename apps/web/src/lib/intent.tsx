import { XChainId } from '@balancednetwork/sdk-core';
import { IntentService, IntentServiceConfig } from 'icon-intents-sdk';

export const ALLOWED_XCHAIN_IDS: XChainId[] = ['0x89.polygon', '0xa4b1.arbitrum', 'sui'];

export const intentServiceConfig: IntentServiceConfig = {
  solverApiEndpoint: 'https://solver.iconblockchain.xyz',
};

export const intentService = new IntentService(intentServiceConfig);
