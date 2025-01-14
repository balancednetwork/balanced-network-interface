import { IntentService, IntentServiceConfig } from '@balancednetwork/intents-sdk';

export const intentServiceConfig: IntentServiceConfig = {
  solverApiEndpoint: 'https://solver.iconblockchain.xyz',
};

export const intentService = new IntentService(intentServiceConfig);
