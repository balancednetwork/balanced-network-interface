import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

import { getHubChainConfig, getMoneyMarketConfig, HttpUrl } from '@sodax/sdk';

// Configure Sodax
const sodaxConfig = {
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  },
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  solver: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef' as `0x${string}`,
    solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz' as HttpUrl,
    partnerFee: {
      address: '0x75F6D018319Dd5Dc2Cb1c3f2FA4Ad161765a9b5A' as `0x${string}`,
      percentage: 10, // .1%
    },
  },
  relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz' as HttpUrl,
};

export default sodaxConfig;
