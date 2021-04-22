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
  daofund: '',
  rewards: '',
  dex: '',
  governance: '',
  band: '',
  sicx: '',
  bnusd: '',
  baln: '',
  bwt: '',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx6b94be20f9e93c034eed3f792a2d12fe32e7fe8b',
  staking: 'cxce859138e39a8629626ee5e528c2ba60791fbae6',
  dividends: 'cx41ce6e441146d790393e2233bed36fb5a4326ca9',
  reserve: 'cxb786d5b1bfc5d2a82f804a35c0b4dd60de0aefc2',
  daofund: 'cx3c4238b749a0c53b61181c04e303a73c33dfccb0',
  rewards: 'cx7a97f2e67d2b8e190d3a7e53d7034fb39d9bfae0',
  dex: 'cx80713c855b0b3ac1d03ae9277d10645d264f2eb9',
  governance: 'cx3b7bcf9fc03e3635ca5766930a8512a1968bc666',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxaf214dc1439bef59eb691db53d009f949ba8daa9',
  bnusd: 'cx5f4083e1c220f49ee4da14c6cb379d8ec6989a4d',
  baln: 'cx065e019e66836faa92687836d8d9ca65dd0d86ac',
  bwt: 'cx6efca3e6b6b6f1141d6bccf7afacb3ada9901c9e',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
