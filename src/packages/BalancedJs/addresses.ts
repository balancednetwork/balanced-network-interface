export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: 'cx66d4d90f5f113eba575bf793570135f9b10cece1',
  staking: 'cx43e2eec79eb76293c298f2b17aec06097be606e0',
  dividends: 'cx203d9cd2a669be67177e997b8948ce2c35caffae',
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
  airdrip: 'cxaf244cf3c7164fe6f996f398a9d99c4d4a85cf15',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx3259f3ff9a51ca3bf170d4ff9104cf4af126ca1c',
  staking: 'cx9d829396d887f9292d8af488fab78ad24ab6b99a',
  dividends: 'cx5b996d251009340f7c312b9df5c44f0f39a20a91',
  reserve: 'cx1754666c6779dc5e495a462144dd15e4a68fe776',
  daofund: 'cx430955c5a5e2a6e48c1f2aaa7258dc4c84222247',
  rewards: 'cx893fccdd0881d8e2bd2625f711b38e06848ecb89',
  dex: 'cx399dea56cf199b1c9e43bead0f6a284bdecfbf62',
  governance: 'cx483630769b61b76387d6ed90c911c16da546784f',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxae6334850f13dfd8b50f8544d5acb126bb8ef82d',
  bnusd: 'cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a',
  baln: 'cx36169736b39f59bf19e8950f6c8fa4bfa18b710a',
  omm: 'cxa96491850d5dd69efa5d64afa9138fd4a66cd348',
  iusdc: 'cx65f639254090820361da483df233f6d0e69af9b7',
  usds: 'cxaa068556df80f9917ef146e889f0b2c4b13ab634',
  bwt: 'cx5d886977b7d24b9f73a460c9ca2d43847997c285',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
