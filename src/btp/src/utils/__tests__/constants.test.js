import { PAIRED_NETWORKS, pairedNetworks, connectedNetWorks, nativeTokens } from 'utils/constants';

import { getTokenOptions, getBalanceToken, getTartgetNetwork } from '../constants';

describe('utils/constants', () => {
  describe('getTokenOptions', () => {
    test('ICON-BSC chains + BSC side (Metamask)', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);

      expect(getTokenOptions(connectedNetWorks.bsc)).toEqual([
        nativeTokens[connectedNetWorks.bsc],
        { symbol: 'ETH', netWorkLabel: 'Etherium' },
      ]);
    });

    test('ICON-BSC chains + ICON side (ICONex)', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);

      expect(getTokenOptions(connectedNetWorks.icon)).toEqual([
        nativeTokens[connectedNetWorks.icon],
        { symbol: 'ETH', netWorkLabel: 'Etherium' },
      ]);
    });

    test('ICON-Moonbeam chains + ICON side (ICONex)', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);

      expect(getTokenOptions(connectedNetWorks.icon)).toEqual([
        nativeTokens[connectedNetWorks.icon],
        nativeTokens[connectedNetWorks.moonbeam],
      ]);
    });

    test('ICON-Moonbeam chains + Moonbeam side (ICONex)', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);

      expect(getTokenOptions(connectedNetWorks.moonbeam)).toEqual([
        nativeTokens[connectedNetWorks.moonbeam],
        nativeTokens[connectedNetWorks.icon],
      ]);
    });
  });

  test('getBalanceToken', () => {
    localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);
    expect(getBalanceToken()).toEqual([
      nativeTokens[connectedNetWorks.icon].symbol,
      'ETH',
      nativeTokens[connectedNetWorks.bsc].symbol,
    ]);

    localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);
    expect(getBalanceToken()).toEqual([
      nativeTokens[connectedNetWorks.icon].symbol,
      nativeTokens[connectedNetWorks.moonbeam].symbol,
    ]);
  });

  describe('getTartgetNetwork', () => {
    test('ICON-Moonbeam + ICON side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);

      expect(getTartgetNetwork(connectedNetWorks.icon)).toEqual([
        { value: connectedNetWorks.moonbeam, label: connectedNetWorks.moonbeam },
      ]);
    });

    test('ICON-Moonbeam + Moonbeam side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);

      expect(getTartgetNetwork(connectedNetWorks.moonbeam)).toEqual([
        { value: connectedNetWorks.icon, label: connectedNetWorks.icon },
      ]);
    });

    test('ICON-BSC + ICON side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);

      expect(getTartgetNetwork(connectedNetWorks.icon)).toEqual([
        { value: connectedNetWorks.bsc, label: connectedNetWorks.bsc },
      ]);
    });

    test('ICON-BSC + BSC side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);

      expect(getTartgetNetwork(connectedNetWorks.bsc)).toEqual([
        { value: connectedNetWorks.icon, label: connectedNetWorks.icon },
      ]);
    });
  });
});
