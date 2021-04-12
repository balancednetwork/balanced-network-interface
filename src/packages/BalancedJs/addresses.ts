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
  loans: 'cxfda2a8c77bd8fb44ac07884205e0f920edbff518',
  staking: 'cx56800918000d3ac69b72aa37013fccce0fb4efb8',
  dividends: 'cx6b8c84e69b6286c869ae21992e7394a415e6c48b',
  reserve: 'cx24f70164e1de9b03d7827cd742c0372b5d0faf1d',
  rewards: 'cx97130cbc9d0f49d64298c50bc40af5a3bffa1800',
  dex: 'cxc295ccc7606007bfecde9917e0c27459301f9962',
  governance: 'cx805cc8a62e5836b4c8adff6fde2cf18d4285633b',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx299655d0586811ff6173c21946206894c1008ca3',
  bnusd: 'cxb871c2c0bb8e37df7686c033b47c1e552018794a',
  baln: 'cx6420155143c7eac8fa79fee9b5282c9b267ef31c',
  bwt: 'cx5a5e2e315b908b57a88a7818d78410d4fb3bc492',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
