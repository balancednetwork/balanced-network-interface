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
  multicall: 'cxa4aa9185e23558cff990f494c1fd2845f6cbf741',
  disbursement: 'cxe3905591929d17fc8496ae28ee3b9c144579228e',
  stabilityfund: 'cxa09dbb60dcb62fffbd232b6eae132d730a2aafa6',
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
  stabilityfund: '',
};

const SEJONG_ADDRESSES = {
  loans: 'cxc5e1eae2f3560f266ea35fe34b1a39db9c99cc69',
  staking: 'cxfbf525229307669cbf8be7faddbe48c96fb52209',
  dividends: 'cx5f123b9a221882d92c508a7eaf0c66bb11e1c216',
  reserve: 'cxf07d3baf2eecdad496468b1047f68bb90036136c',
  daofund: 'cxb67b8445b679c32fa0f95278f9263674a2bdcc1f',
  rewards: 'cxdbbd4deb3e46d3dff280406d2c795cdfcd1ebcfd',
  dex: 'cx648a6d9c5f231f6b86c0caa9cc9eff8bd6040999',
  rebalancing: 'cxaa6f520b655d5fb2d43feae45e83d093c88f58f6',
  governance: 'cx541e2e8b9673e736b727e3f6313ada687539f50f',
  band: 'cx900e2d17c38903a340a0181523fa2f720af9a798',
  router: 'cxf9e996d3ab20b83ed6bacb28ebf157c484c4b695',
  airdrip: '',
  sicx: 'cx70806fdfa274fe12ab61f1f98c5a7a1409a0c108',
  bnusd: 'cx5838cb516d6156a060f90e9a3de92381331ff024',
  baln: 'cx303470dbc10e5b4ab8831a61dbe00f75db10c38b',
  bwt: 'cx68b822ae2acc76e9ec6143a8afbeb79e50a26e8f',
  multicall: 'cx02510602b5f028ee418fc5a8ba893aa2dbb56ece',
  disbursement: '',
  stabilityfund: 'cx342c69da9d8ac099f10fc4eb226ae0de54d8097f',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
  [NetworkId.SEJONG]: SEJONG_ADDRESSES,
};

export default addresses;
