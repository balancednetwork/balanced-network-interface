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
  loans: 'cx9ba27c7c2748161c715df5858cce9d90a0c6f481',
  staking: 'cxa688da02bcdebfc9896fdae42b16ba22ece88d1e',
  dividends: 'cx6d21fc244448f64dc5412950d932c9d04fc0476b',
  reserve: 'cxaa1d2725b097ece8e3b1189857a5be1cf93dbe04',
  daofund: 'cxcf54974d450234223a2f59e713847185ab1ad9a8',
  rewards: 'cx3e041d560a089f4af1e4722cda1d1625d2650162',
  dex: 'cxda87be03ebc88b7726cb739e0869336cba836a22',
  governance: 'cx1c84b1d5721b605e71bdb7d6e46ca7c5ed046ce8',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxac729dee78a0937c5c51cae94383533f9f21c10b',
  bnusd: 'cx79c38de22e9a1c995736a089060e4a4edcaf8b49',
  baln: 'cx41e1523b109ab8ee96f7732dfbb51af8218af889',
  bwt: 'cxeac5a08d5125a3a2f73d08fb6e099109a53b79f9',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
