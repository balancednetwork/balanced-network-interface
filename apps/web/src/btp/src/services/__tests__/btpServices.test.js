import {
  getAuctions,
  getAuctionDetails,
  getAvailableAssets,
  getFeeAssets,
  getAvailableAmountLast24h,
  getRelays,
  getRelayCandidates,
  getTotalRewardFund,
  getNetwork,
  getConnectedNetworks,
  getTransferHistory,
  getTransferHistoryByTxHash,
  tokenToUsd,
  baseRelayURL,
  baseAuctionURL,
  baseBTPNetwork,
} from '../btpServices';

jest.mock('utils/fetch', () => {
  return {
    fetchAPI: jest.fn().mockImplementation(endpoint => endpoint),
  };
});

describe('services/btpServices', () => {
  test('getAuctions', () => {
    expect(getAuctions()).toBe(baseAuctionURL);
  });

  test('getAuctionDetails', () => {
    const id = 1;
    expect(getAuctionDetails(id)).toBe(baseAuctionURL + '/' + id);
  });

  test('getAvailableAssets', () => {
    expect(getAvailableAssets()).toBe(baseAuctionURL + '/?availableAssets=1');
  });

  test('getFeeAssets', () => {
    expect(getFeeAssets()).toBe('/fees');
  });

  test('getAvailableAmountLast24h', () => {
    expect(getAvailableAmountLast24h()).toBe('/fees/?availableAmountLast24h=1');
  });

  test('getRelays', () => {
    expect(getRelays()).toBe(baseRelayURL + '?limit=10&page=0');
  });

  test('getRelayCandidates', () => {
    expect(getRelayCandidates()).toBe('/relay-candidates?limit=10&page=0');
  });

  test('getTotalRewardFund', () => {
    expect(getTotalRewardFund()).toBe('/relay-candidates/reward');
  });

  test('getConnectedNetworks', () => {
    expect(getConnectedNetworks()).toBe('/networks');
  });

  test('getNetwork', () => {
    const id = 1;
    expect(getNetwork(id)).toBe('/networks/' + id);
  });

  test('getConnectedNetworks', () => {
    expect(getConnectedNetworks()).toBe('/networks');
  });

  test('getTransferHistory', () => {
    expect(getTransferHistory(0, 10, 'ETH', 'ICON', 'BSC')).toBe(
      '/transactions?page=0&limit=10&assetName=ETH&from=ICON&to=BSC',
    );
  });

  test('getTransferHistoryByTxHash', () => {
    const hash = 'abc';
    expect(getTransferHistoryByTxHash(hash)).toBe('/transactions/' + hash);
  });

  test('tokenToUsd', async () => {
    const token = 'eth';
    const amount = 10;

    expect(await tokenToUsd('eth', 10)).toBe(
      `${baseBTPNetwork}/converter?token=${token}&amount=${amount}&convert_to=usd`,
    );
  });
});
