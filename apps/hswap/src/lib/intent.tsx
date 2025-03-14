import { IntentService, IntentServiceConfig } from 'icon-intents-sdk';

export const intentServiceConfig: IntentServiceConfig = {
  solverApiEndpoint: 'https://staging-solver.iconblockchain.xyz',
};

export const intentService = new IntentService(intentServiceConfig);
