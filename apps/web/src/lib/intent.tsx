import { IntentService, IntentServiceConfig } from '@balancednetwork/intents-sdk';

export const intentServiceConfig: IntentServiceConfig = {
  solverApiEndpoint: 'http://staging-solver.iconblockchain.xyz',
};

export const intentService = new IntentService(intentServiceConfig);
