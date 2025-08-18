import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

import { HttpUrl, getHubChainConfig, getMoneyMarketConfig } from '@sodax/sdk';

export const PARTNER_FEE_ADDRESS = '0x75F6D018319Dd5Dc2Cb1c3f2FA4Ad161765a9b5A' as `0x${string}`;
export const PARTNER_FEE_PERCENTAGE = 10; // 0.1%

// Configure Sodax
const sodaxConfig = {
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  },
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  solver: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef' as `0x${string}`,
    //PROD
    // solverApiEndpoint: 'https://sodax-solver.iconblockchain.xyz/' as HttpUrl,
    solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz' as HttpUrl,
    partnerFee: {
      address: PARTNER_FEE_ADDRESS,
      percentage: PARTNER_FEE_PERCENTAGE,
    },
  },
  relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz' as HttpUrl,
};

export default sodaxConfig;
