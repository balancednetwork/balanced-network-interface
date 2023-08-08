import { SupportedChainId } from '@balancednetwork/balanced-js';
import { ethers } from 'ethers';

import { tokenTypes } from '../utils/constants';
import { custom } from './chainCustomization';
import { ABI as currentABI } from './MetaMask/ABI';

const config = {
  mainnet: {
    // --------------------------------------------------------
    REACT_APP_VERSION: '$npm_package_version',
    REACT_APP_BTP_ENDPOINT: 'https://backend.nexusportal.io/v1',
    REACT_APP_ENV: 'mainnet',

    // --------------------------------------------------------
    // ICON
    REACT_APP_CHAIN_ICON_RPC_URL: 'https://ctz.solidwallet.io/api/v3/icon_dex',
    REACT_APP_CHAIN_ICON_EXPLORE_URL: 'https://tracker.icon.community/',
    REACT_APP_CHAIN_ICON_NETWORK_ADDRESS: '0x1.icon',
    REACT_APP_CHAIN_ICON_CHAIN_NAME: 'ICON',
    REACT_APP_CHAIN_ICON_COIN_SYMBOL: 'ICX',
    REACT_APP_CHAIN_ICON_STEP_LIMIT: '2500000',

    // --------------------------------------------------------
    // BSC
    REACT_APP_CHAIN_BSC_RPC_URL: 'https://bsc-dataseed.binance.org/',
    REACT_APP_CHAIN_BSC_EXPLORE_URL: 'https://bscscan.com/',
    REACT_APP_CHAIN_BSC_NETWORK_ADDRESS: '0x38.bsc',
    REACT_APP_CHAIN_BSC_CHAIN_NAME: 'BNB Smart Chain',
    REACT_APP_CHAIN_BSC_COIN_SYMBOL: 'BNB',
    REACT_APP_CHAIN_BSC_GAS_LIMIT: '6691B7',

    REACT_APP_CHAIN_BSC_ICON_BTS_CORE: 'cxcef70e92b89f2d8191a0582de966280358713c32',
    REACT_APP_CHAIN_BSC_BTS_CORE: '0x7A4341Af4995884546Bcf7e09eB98beD3eD26D28',

    // NEAR
    // REACT_APP_CHAIN_NEAR_RPC_URL: 'https://rpc.testnet.near.org',
    // REACT_APP_CHAIN_NEAR_EXPLORE_URL: 'https://explorer.testnet.near.org/',
    // REACT_APP_CHAIN_NEAR_WALLET_URL: 'https://wallet.testnet.near.org',
    // REACT_APP_CHAIN_NEAR_HELPER_URL: 'https://helper.testnet.near.org',
    // REACT_APP_CHAIN_NEAR_NETWORK_ADDRESS: '0x1.near',
    // REACT_APP_CHAIN_NEAR_CHAIN_NAME: 'NEAR',
    // REACT_APP_CHAIN_NEAR_COIN_SYMBOL: 'NEAR',
    // REACT_APP_CHAIN_NEAR_GAS_LIMIT: '300000000000000',

    // REACT_APP_CHAIN_NEAR_ICON_BTS_CORE: 'cx95882bb6a0fda402afc09a52a0141738de8fa133',
    // REACT_APP_CHAIN_NEAR_BTS_CORE: 'bts.iconbridge.testnet',
    // REACT_APP_CHAIN_NEAR_ICX_NEP141_ADDRESS: 'btp-icx.bts.iconbridge.testnet ',
  },
  testnet: {
    //--------------------------------------------------------
    REACT_APP_VERSION: '$npm_package_version',
    REACT_APP_BTP_ENDPOINT: 'https://api.testnet.nexusportal.io/v1',
    REACT_APP_ENV: 'testnet',
    //--------------------------------------------------------
    //ICON
    REACT_APP_CHAIN_ICON_RPC_URL: 'https://lisbon.net.solidwallet.io/api/v3/icon_dex',
    REACT_APP_CHAIN_ICON_EXPLORE_URL: 'https://tracker.lisbon.icon.community/',
    REACT_APP_CHAIN_ICON_NETWORK_ADDRESS: '0x2.icon',
    REACT_APP_CHAIN_ICON_CHAIN_NAME: 'ICON',
    REACT_APP_CHAIN_ICON_COIN_SYMBOL: 'ICX',
    REACT_APP_CHAIN_ICON_STEP_LIMIT: '2500000',
    //--------------------------------------------------------
    //BSC
    REACT_APP_CHAIN_BSC_RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    REACT_APP_CHAIN_BSC_EXPLORE_URL: 'https://testnet.bscscan.com/',
    REACT_APP_CHAIN_BSC_NETWORK_ADDRESS: '0x61.bsc',
    REACT_APP_CHAIN_BSC_CHAIN_NAME: 'BNB Smart Chain',
    REACT_APP_CHAIN_BSC_COIN_SYMBOL: 'BNB',
    REACT_APP_CHAIN_BSC_GAS_LIMIT: '0x6691B7',
    REACT_APP_CHAIN_BSC_ICON_BTS_CORE: 'cxa843db0a27750230559f997bafaeb7f8739afc81',
    REACT_APP_CHAIN_BSC_BTS_CORE: '0x1a2aDf985D6c2700fdAf72A9c1e2b39e3B647F7e',
    //--------------------------------------------------------
    // NEAR
    //   REACT_APP_CHAIN_NEAR_RPC_URL: 'https://rpc.testnet.near.org',
    //   REACT_APP_CHAIN_NEAR_EXPLORE_URL: 'https://explorer.testnet.near.org/',
    //   REACT_APP_CHAIN_NEAR_WALLET_URL: 'https://wallet.testnet.near.org',
    //   REACT_APP_CHAIN_NEAR_HELPER_URL: 'https://helper.testnet.near.org',
    //   REACT_APP_CHAIN_NEAR_NETWORK_ADDRESS: '0x1.near',
    //   REACT_APP_CHAIN_NEAR_CHAIN_NAME: 'NEAR Network',
    //   REACT_APP_CHAIN_NEAR_COIN_SYMBOL: 'NEAR',
    //   REACT_APP_CHAIN_NEAR_GAS_LIMIT: '300000000000000',
    //   REACT_APP_CHAIN_NEAR_ICON_BTS_CORE: 'cx95882bb6a0fda402afc09a52a0141738de8fa133',
    //   REACT_APP_CHAIN_NEAR_BTS_CORE: 'bts.iconbridge.testnet',
    //   REACT_APP_CHAIN_NEAR_ICX_NEP141_ADDRESS: 'btp-icx.bts.iconbridge.testnet',
  },
};
export const chainConfigs = {};
const networkConfig =
  config[process.env.REACT_APP_NETWORK_ID === SupportedChainId.MAINNET.toString() ? 'mainnet' : 'testnet'];
Object.keys(networkConfig).forEach(e => {
  if (e.startsWith('REACT_APP_CHAIN')) {
    const chainName = e.split('_')[3];
    if (!chainConfigs[chainName]) {
      chainConfigs[chainName] = { id: chainName, methods: {}, tokens: [] };
    }
    chainConfigs[chainName][e.split(chainName + '_')[1]] = networkConfig[e];
  }
});

export const customzeChain = (chainId = '') => {
  const { ABI, methods } = custom[chainId] || {};
  if (ABI) {
    ABI.forEach(ABIItem => {
      const index = currentABI.findIndex(a => ABIItem.name === a.name);
      if (index !== -1) {
        currentABI[index] = ABIItem;
      } else {
        currentABI.push(ABIItem);
      }
    });
  }

  if (methods) {
    chainConfigs[chainId].methods = methods;
  }

  for (const c in custom) {
    delete custom[c].ABI;
    delete custom[c].methods;
    for (const prop in custom[c]) {
      chainConfigs[c][prop] = custom[c][prop];
    }
  }

  if (process.env.JEST_WORKER_ID === undefined) {
    console.log('chainConfigs', chainConfigs);
  }
};

export const chainList = Object.values(chainConfigs);

export const getCustomizedChainList = () => chainList.filter(chain => !chain.disabled);

/**
 * get token list (e.g: ETH)
 * @returns {array}
 */
export const getTokenList = () => {
  let tokenList = [];
  for (const c in custom) {
    if (custom[c].tokens?.length > 0 && !custom[c]?.disabled) {
      tokenList = [...tokenList, ...custom[c].tokens.map(prop => ({ ...prop, chainId: c }))];
    }
  }
  return tokenList;
};
export const checkIsToken = token => getTokenList().find(t => t.symbol === token);

export const checkIRC2Token = token => {
  const isToken = checkIsToken(token);
  return isToken?.type === tokenTypes.IRC2;
};

export const findChainbySymbol = symbol => {
  let chain = chainList.find(chain => symbol === chain.COIN_SYMBOL);
  if (!chain) {
    const tokenChain = getTokenList().find(chain => symbol === chain.symbol);
    if (!tokenChain) throw new Error('not found chain');
    chain = { ...chainConfigs[tokenChain.chainId], tokenOf: tokenChain.tokenOf };
  }

  return chain;
};

export const formatSymbol = symbol => {
  const chain = findChainbySymbol(symbol);

  return `btp-${chainConfigs[chain.tokenOf || chain.id].NETWORK_ADDRESS}-${symbol}`;
};

export const parseUnitsBySymbol = (amount, symbol) => {
  const chain = findChainbySymbol(symbol);
  return ethers.utils.parseUnits(amount, chain.decimals || 18).toString();
};

export const formatUnitsBySymbol = (amount, symbol) => {
  const chain = findChainbySymbol(symbol);
  return ethers.utils.formatUnits(amount, chain.decimals || 18).toString();
};
