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
  loans: 'cxaf71888c0bed5bda5b0cf7127ddf66340d587056',
  staking: 'cxc620f55952ed1d897a7db39f76f17257df10ec8f',
  dividends: 'cx1283a5d907cfc5f3fd4393180a79a5f523b3bd6c',
  reserve: 'cx60951d2018ed4b56578a5adaf22c72a989e6003d',
  rewards: 'cx53ebde99a0b8d4dc9d30fbe6a6cff77c75b693f6',
  dex: 'cx1320d7c02b52a2c18044bc75c6be8c82a3bb52eb',
  governance: 'cx1d81f93b3b8d8d2a6455681c46128868782ddd09',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx50b645360896f52a583ae7e7b1da4666d40285cd',
  bnUSD: 'cx0399a75f88323f13daea97f114440f14fd551494',
  baln: 'cxdfa188a9ef06d9e6a5118b9c73c3fac1567bc889',
  bwt: 'cxa2dd90f9b85a22c3514e21f309c3e52e8eec02af',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
