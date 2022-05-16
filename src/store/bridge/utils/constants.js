export const wallets = {
  metamask: 'metamask',
  iconex: 'iconex',
  hana: 'hana',
  near: 'NEAR',
};

export const connectedNetWorks = {
  icon: 'ICON blockchain',
  moonbeam: 'Moonbase Alpha',
  bsc: 'Binance Smart Chain',
  near: 'NEAR Protocol',
};

export const nativeTokens = {
  [connectedNetWorks.icon]: {
    symbol: 'ICX',
    netWorkLabel: 'ICON',
  },
  [connectedNetWorks.moonbeam]: {
    symbol: 'DEV',
    netWorkLabel: 'Moonbeam',
  },
  [connectedNetWorks.bsc]: {
    symbol: 'BNB',
    netWorkLabel: 'Binance',
  },
  [connectedNetWorks.near]: {
    symbol: 'NEAR',
    netWorkLabel: 'NEAR Protocol',
  },
};

export const tokenOptionList = Object.values(nativeTokens);

export const SUCCESS_TRANSACTION = 'SUCCESS_TRANSACTION';

export const PAIRED_NETWORKS = 'PAIRED_NETWORKS';
export const pairedNetworks = {
  'ICON-Moonbeam': 'ICON-Moonbeam',
  'ICON-BSC': 'ICON-BSC',
  'ICON-NEAR': 'ICON-NEAR',
};

export const getPairedNetwork = () => localStorage.getItem(PAIRED_NETWORKS) || pairedNetworks['ICON-Moonbeam'];

export const getTokenOptions = currentNetwork => {
  if (!currentNetwork) return [];

  switch (currentNetwork) {
    case connectedNetWorks.icon:
      switch (getPairedNetwork()) {
        case pairedNetworks['ICON-Moonbeam']:
          return [nativeTokens[connectedNetWorks.icon], nativeTokens[connectedNetWorks.moonbeam]];

        case pairedNetworks['ICON-BSC']:
          return [nativeTokens[connectedNetWorks.icon], { symbol: 'ETH', netWorkLabel: 'Etherium' }];

        case pairedNetworks['ICON-NEAR']:
          return [nativeTokens[connectedNetWorks.near]];

        default:
          console.log('Requires paired network value.');
          break;
      }
      break;
    case connectedNetWorks.moonbeam:
      return [nativeTokens[connectedNetWorks.moonbeam], nativeTokens[connectedNetWorks.icon]];

    case connectedNetWorks.bsc:
      return [nativeTokens[connectedNetWorks.bsc], { symbol: 'ETH', netWorkLabel: 'Etherium' }];

    case connectedNetWorks.near:
      return [nativeTokens[connectedNetWorks.near]];
    default:
      return;
  }
};

export const getBalanceToken = () => {
  switch (getPairedNetwork()) {
    case pairedNetworks['ICON-Moonbeam']:
      return [nativeTokens[connectedNetWorks.icon].symbol, nativeTokens[connectedNetWorks.moonbeam].symbol];
    case pairedNetworks['ICON-BSC']:
      return [nativeTokens[connectedNetWorks.icon].symbol, 'ETH', nativeTokens[connectedNetWorks.bsc].symbol];
    case pairedNetworks['ICON-NEAR']:
      return [nativeTokens[connectedNetWorks.near].symbol];

    default:
      console.log('No matching paired network');
      break;
  }
};

export const getTartgetNetwork = currentNetwork => {
  if (!currentNetwork) return [];
  const currentPairedNetworks = getPairedNetwork();
  const networkList = [{ value: connectedNetWorks.icon, label: connectedNetWorks.icon }];

  switch (currentNetwork) {
    case connectedNetWorks.icon:
      switch (currentPairedNetworks) {
        case pairedNetworks['ICON-Moonbeam']:
          networkList.push({
            value: connectedNetWorks.moonbeam,
            label: connectedNetWorks.moonbeam,
          });
          break;

        case pairedNetworks['ICON-BSC']:
          networkList.push({
            value: connectedNetWorks.bsc,
            label: connectedNetWorks.bsc,
          });
          break;

        case pairedNetworks['ICON-NEAR']:
          networkList.push({
            value: connectedNetWorks.near,
            label: connectedNetWorks.near,
          });
          break;

        default:
          console.log('Requires paired network value.');
          break;
      }
      break;
    // case connectedNetWorks.bsc:
    // case connectedNetWorks.near:
    default:
      break;
  }

  return networkList.filter(network => (currentNetwork.includes(network.label) ? false : network));
};
