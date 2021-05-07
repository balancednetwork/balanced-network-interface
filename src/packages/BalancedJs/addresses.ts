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
  airdrip: 'cxaf244cf3c7164fe6f996f398a9d99c4d4a85cf15',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cxc1d3d27091f8d7c6fa13a689141399a7e990bf5d',
  staking: 'cx622af77e0f399f354dd341a2c43d57fbc25a648b',
  dividends: 'cxd5a70dec9152fcc06be519b3b06793671366ce88',
  reserve: 'cx1a8c7dd51cd2daeee7cb0ad130af359924dc9cad',
  daofund: 'cx62bd27d2df5df27612953b90344693e2020671b9',
  rewards: 'cx4a1a221af74c45ff7ed8f78d242fc6df21726b0e',
  dex: 'cx0b2657928730ef558253eba5ade916fa3cb45691',
  governance: 'cxbbb91d8d9b95c55311908dc61eebaf8cf5303962',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx8a478c6df7c1f28b8784637c49594c9e9eb6e6a9',
  bnusd: 'cx442fb951d21393fb59e62f8f8e8ee5e27ef263b9',
  baln: 'cx9b4199ca6c9f7d945614cc8ad897fe50511dc7dd',
  bwt: 'cxe4127f747d0f21ecb0a752c63bfd82de36b63c1c',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
