import { fetchAPI } from '../utils/fetch';

export const baseAuctionURL = '/auctions';
export const baseRelayURL = '/relays';
export const baseBTPNetwork = '/btpnetwork';

export const getAuctions = () => {
  return fetchAPI(baseAuctionURL);
};

export const getAuctionDetails = auctionId => {
  return fetchAPI(`${baseAuctionURL}/${auctionId}`);
};

export const getAuctionBids = (auctionId, offset, limit = 10) => {
  return fetchAPI(`${baseAuctionURL}/${auctionId}/bids?limit=${limit}&offset=${offset}`);
};

export const getAvailableAssets = () => {
  return fetchAPI(`${baseAuctionURL}/?availableAssets=1`);
};

export const getFeeAssets = () => {
  return fetchAPI(`/fees`);
};

export const getAvailableAmountLast24h = () => {
  return fetchAPI(`/fees/?availableAmountLast24h=1`);
};

export const getRelays = (page = 0, limit = 10) => {
  return fetchAPI(`${baseRelayURL}?limit=${limit}&page=${page}`);
};

export const getRelayCandidates = (page = 0, limit = 10) => {
  return fetchAPI(`/relay-candidates?limit=${limit}&page=${page}`);
};

export const getTotalRewardFund = () => {
  return fetchAPI(`/relay-candidates/reward`);
};

export const getConnectedNetworks = () => {
  return fetchAPI(`/networks`);
};

export const getNetwork = id => {
  return fetchAPI(`/networks/${id}`);
};

export const getTransferHistory = (page, limit = 20, assetName, from, to) => {
  return fetchAPI(`/transactions?page=${page}&limit=${limit}&assetName=${assetName}&from=${from}&to=${to}`);
};

export const getTransferHistoryByTxHash = txHash => {
  return fetchAPI(`/transactions/${txHash}`);
};

export const tokenToUsd = async (token, amount) => {
  return fetchAPI(`${baseBTPNetwork}/converter?token=${token}&amount=${amount}&convert_to=usd`);
};

export const sendLog = async payload => {
  return fetchAPI('/transaction-ips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
};
