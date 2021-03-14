export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: '',
  staking: '',
  dividends: '',
  reserve: '',
  rewards: '',
  dex: '',
  governance: '',
  band: '',
  sicx: '',
  bnUSD: '',
  baln: '',
  bwt: '',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cxc3a8dd98d922e2a1e4a6e9c836c410a1d564ad7e',
  staking: 'cxc337abaf1b24e13e827644501716ebaaab9493f2',
  dividends: 'cx0c58366ebf1b05fa917754e4e5d3873c016d39b1',
  reserve: 'cxf9a0c7866fc95e34ee041fb38fa568520719c1cf',
  rewards: 'cx67da40d0c49fa340954c6945c83860b52a581653',
  dex: 'cxdf85ae1d175a8978955a0149914ad697d78d18fe',
  governance: 'cx9806e13bad38e4fca402eb2fde9779d303fc428a',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxcdae80da2964665c5b2480477a44b9646511d7ee',
  bnUSD: 'cx0399a75f88323f13daea97f114440f14fd551494',
  baln: 'cxdfa188a9ef06d9e6a5118b9c73c3fac1567bc889',
  bwt: 'cxa2dd90f9b85a22c3514e21f309c3e52e8eec02af',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
