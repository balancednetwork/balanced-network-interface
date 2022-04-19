import { SupportedChainId as NetworkId } from './chain';

const MAINNET_ADDRESSES = {
  loans: 'cx66d4d90f5f113eba575bf793570135f9b10cece1',
  staking: 'cx43e2eec79eb76293c298f2b17aec06097be606e0',
  dividends: 'cx203d9cd2a669be67177e997b8948ce2c35caffae',
  reserve: 'cxf58b9a1898998a31be7f1d99276204a3333ac9b3',
  daofund: 'cx835b300dcfe01f0bdb794e134a0c5628384f4367',
  rewards: 'cx10d59e8103ab44635190bd4139dbfd682fa2d07e',
  dex: 'cxa0af3165c08318e988cb30993b3048335b94af6c',
  rebalancing: 'cx40d59439571299bca40362db2a7d8cae5b0b30b0',
  governance: 'cx44250a12074799e26fdeee75648ae47e2cc84219',
  band: 'cxe647e0af68a4661566f5e9861ad4ac854de808a2',
  router: 'cx21e94c08c03daee80c25d8ee3ea22a20786ec231',
  airdrip: 'cxaf244cf3c7164fe6f996f398a9d99c4d4a85cf15',
  sicx: 'cx2609b924e33ef00b648a409245c7ea394c467824',
  bnusd: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
  baln: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
  bwt: 'cxcfe9d1f83fa871e903008471cca786662437e58d',
  multicall: 'cx793970c9ec84eb0dcb6164965c74fe678474d7c7',
  disbursement: 'cxe3905591929d17fc8496ae28ee3b9c144579228e',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx3259f3ff9a51ca3bf170d4ff9104cf4af126ca1c',
  staking: 'cx9d829396d887f9292d8af488fab78ad24ab6b99a',
  dividends: 'cx5b996d251009340f7c312b9df5c44f0f39a20a91',
  reserve: 'cx1754666c6779dc5e495a462144dd15e4a68fe776',
  daofund: 'cx430955c5a5e2a6e48c1f2aaa7258dc4c84222247',
  rewards: 'cx893fccdd0881d8e2bd2625f711b38e06848ecb89',
  dex: 'cx399dea56cf199b1c9e43bead0f6a284bdecfbf62',
  rebalancing: 'cx2e3398dfce78a3c83de8a41d7c5f4aa40d3a4f30',
  governance: 'cx483630769b61b76387d6ed90c911c16da546784f',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  router: 'cx4c456f4a02d2576fe712ea10b311a5fe8d06d205',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
  sicx: 'cxae6334850f13dfd8b50f8544d5acb126bb8ef82d',
  bnusd: 'cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a',
  baln: 'cx36169736b39f59bf19e8950f6c8fa4bfa18b710a',
  bwt: 'cx5d886977b7d24b9f73a460c9ca2d43847997c285',
  multicall: '',
  disbursement: '',
};

const SEJONG_ADDRESSES = {
  loans: 'cx880c58796305f10d1db12ed2179c7049aa9100f6',
  staking: 'cxc474cc7aca4dc0931c0ae1d6f61f0c4a21b2df25',
  dividends: 'cx5c041caca96d4828b2b5991313385a1fd29fcb4d',
  reserve: 'cxd927894d1068542321fdd6758da1cf22fa96f432',
  daofund: 'cxb5f58f7e904a8651595d076dc04b0c32e94dcd4c',
  rewards: 'cxdbbd4deb3e46d3dff280406d2c795cdfcd1ebcfd',
  dex: 'cxf0276a2413b46d5660e09c4935eecbf401c5811a',
  rebalancing: 'cx9faa2b11659451c63c3eca3e5f5ca695e16bcfea',
  governance: 'cx541e2e8b9673e736b727e3f6313ada687539f50f',
  band: 'cx900e2d17c38903a340a0181523fa2f720af9a798',
  router: 'cx8ee3449d7514022e46ec0cc541bb1634983829c3',
  airdrip: '',
  sicx: 'cxcc57144332b23ca8f36d09d862bc202caa76dc30',
  bnusd: 'cx38b5f44ad2f4486172dfea12e6cde67a23eadaf1',
  baln: 'cx24e326b2e8b979c444b86037255a1cf161246f12',
  bwt: 'cxd5e477c6e6774574250502f683529b0ea590bea3',
  multicall: 'cx0657efc7ff637faf41fa15c4bb40440cd2a668d7',
  disbursement: '',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
  [NetworkId.SEJONG]: SEJONG_ADDRESSES,
};

export default addresses;
