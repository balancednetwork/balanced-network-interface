export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: 'cx66d4d90f5f113eba575bf793570135f9b10cece1',
  staking: 'cx43e2eec79eb76293c298f2b17aec06097be606e0',
  dividends: 'cx13f08df7106ae462c8358066e6d47bb68d995b6d',
  reserve: 'cxf58b9a1898998a31be7f1d99276204a3333ac9b3',
  daofund: 'cx835b300dcfe01f0bdb794e134a0c5628384f4367',
  rewards: 'cx10d59e8103ab44635190bd4139dbfd682fa2d07e',
  dex: 'cxa0af3165c08318e988cb30993b3048335b94af6c',
  governance: 'cx44250a12074799e26fdeee75648ae47e2cc84219',
  band: 'cxe647e0af68a4661566f5e9861ad4ac854de808a2',
  sicx: 'cx2609b924e33ef00b648a409245c7ea394c467824',
  bnusd: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
  baln: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
  bwt: 'cxcfe9d1f83fa871e903008471cca786662437e58d',
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
