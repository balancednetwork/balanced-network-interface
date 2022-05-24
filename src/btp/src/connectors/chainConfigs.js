import { custom } from './chainCustomization';
import { ABI as currentABI } from './MetaMask/ABI';

const config = {
  REACT_APP_VERSION: '$npm_package_version',
  REACT_APP_BTP_ENDPOINT: 'http://3.14.12.131:8000/v1',

  // # ICON
  REACT_APP_CHAIN_ICON_RPC_URL: 'https://berlin.net.solidwallet.io/api',
  REACT_APP_CHAIN_ICON_NETWORK_ADDRESS: '0x7.icon',
  REACT_APP_CHAIN_ICON_CHAIN_NAME: 'ICON network',
  REACT_APP_CHAIN_ICON_COIN_SYMBOL: 'ICX',
  REACT_APP_CHAIN_ICON_STEP_LIMIT: '2000000',

  // # --------------------------------------------------------
  // # BSC
  REACT_APP_CHAIN_BSC_RPC_URL: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  REACT_APP_CHAIN_BSC_NETWORK_ADDRESS: '0x61.bsc',
  REACT_APP_CHAIN_BSC_CHAIN_NAME: 'Binance Smart Chain',
  REACT_APP_CHAIN_BSC_COIN_SYMBOL: 'BNB',
  REACT_APP_CHAIN_BSC_GAS_LIMIT: '6691B7',

  REACT_APP_CHAIN_BSC_BSH_CORE: '0x84Fbf3F2a497C5be1De18a9d65EeEC297eB7Db41',
  REACT_APP_CHAIN_BSC_BEP20: '0x0df55BeBdF518C3c2937498E4459414a4Ac124DD',
  REACT_APP_CHAIN_BSC_BSH_PROXY: '0x34820E63fb2a000cEEFA7F8a1B8bf2234965947B',
  REACT_APP_CHAIN_BSC_BSH_ICX: '0x60185069f125a7A2Cf5cBAa193533bcB2b73f518',
  REACT_APP_CHAIN_BSC_ICON_BSH_ADDRESS: 'cxe3fbc6d12fc842935ad68991b5247ea821584002',
  REACT_APP_CHAIN_BSC_ICON_IRC2_ADDRESS: 'cxe7ca2013a1b2a39947ae7fe2acc02b9ba081741d',
  REACT_APP_CHAIN_BSC_ICON_TOKEN_BSH_ADDRESS: 'cx57a716d2363893f8d677a5079bd7d482ee7b2aff',

  // # --------------------------------------------------------
  // # Hamorny
  REACT_APP_CHAIN_HARMONY_RPC_URL: 'https://rpc.s0.b.hmny.io',
  REACT_APP_CHAIN_HARMONY_NETWORK_ADDRESS: '0x6357d2e0.hmny',
  REACT_APP_CHAIN_HARMONY_CHAIN_NAME: 'Harmony',
  REACT_APP_CHAIN_HARMONY_COIN_SYMBOL: 'ONE',
  REACT_APP_CHAIN_HARMONY_GAS_LIMIT: '4C4B400',

  REACT_APP_CHAIN_HARMONY_BSH_CORE: '0xA03e9Fb138831D349851A1526EE9778Aec5e7961',
  REACT_APP_CHAIN_HARMONY_BEP20: '0xD675E934898810373055B2770a0D9Ca224f00Ed3',
  REACT_APP_CHAIN_HARMONY_BSH_PROXY: '0x42C870cC7d478d6149f875AbE0dFb956B6ad71E8',
  REACT_APP_CHAIN_HARMONY_BSH_ICX: '0xebD56c95bb204680b2C5b687c679bfe65b3ddadF',
  REACT_APP_CHAIN_HARMONY_ICON_BSH_ADDRESS: 'cxedde5ba834fddcea4ae488eb0e588abb2b7831a9',
  REACT_APP_CHAIN_HARMONY_ICON_IRC2_ADDRESS: 'cxc8977431935cb682db1e11f17ac0e19291aeabb4',
  REACT_APP_CHAIN_HARMONY_ICON_TOKEN_BSH_ADDRESS: 'cxd0bf4867012eed4eca6901568d803e892c992f61',
};
export const chainConfigs = {};
Object.keys(config).forEach(e => {
  if (e.startsWith('REACT_APP_CHAIN')) {
    const chainName = e.split('_')[3];
    if (!chainConfigs[chainName]) {
      chainConfigs[chainName] = { id: chainName, methods: {}, tokens: [] };
    }
    chainConfigs[chainName][e.split(chainName + '_')[1]] = config[e];
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
export const getTokenList = () => {
  let tokenList = [];
  for (const c in custom) {
    if (custom[c].tokens.length > 0) {
      tokenList = [...tokenList, ...custom[c].tokens.map(prop => ({ ...prop, chainId: c }))];
    }
  }

  return tokenList;
};
export const checkIsToken = token => getTokenList().find(t => t.symbol === token);
