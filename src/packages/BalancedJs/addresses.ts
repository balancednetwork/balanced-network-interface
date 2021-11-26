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
};

const SEJONG_ADDRESSES = {
  loans: 'cx297c9f15654816605f4ad7edc17947bfae896999',
  staking: 'cxbdeacd9f258e327f555ba8f073f759832c624b1a',
  dividends: 'cx243877e80c35ca315f3fcbbbb7925d4c6053410a',
  reserve: 'cx79887a2f158d8f90f3bbb6bf9fc20ae962c16831',
  daofund: 'cx5f3b764090cf2d325cf94d8eb8b45ed90b8f7f4d',
  rewards: 'cxe6c1c771c28225bfcb26c689027039bcc3660eac',
  dex: 'cxce63668233c02ccd8b294891665ecd536a69ef35',
  rebalancing: 'cx73b0a8abf77fb76380e15834ec1d26b1497139ef',
  governance: 'cx11261d403bea34e8f603d905bd20932eed620b51',
  // oracle: 'cx8f87a4ce573a2e1377545feabac48a960e8092bb',
  router: 'cxdd28bd21ea1befdf5196080ff04965dabf502788',
  feehandler: 'cx0d1edac2a5e3461dab4dd415c042a906af33d638',
  stakedLp: 'cx13e84e462c4176727729ac8e8b0746aff5419e9d',
  sicx: 'cxbfff6422301908a638a498efcaa9eed5394abd11',
  bnXLM: 'cx51a850439f414d47532b987849313eee4b485296',
  bnDOGE: 'cxf1c8cd6213a6dedea450f053702ecea68a99ade1',
  baln: 'cxf6ee84c2fdfb1c5f5684d71a53074e7844098c00',
  bwt: 'cxa2db8865fa670c6c8aee5d24bd8f279cb04a5510',

  band: 'cx8f87a4ce573a2e1377545feabac48a960e8092bb', // oracle
  airdrip: '',
  bnusd: 'cxe05ac60a7ab3bde875287b70ea3b0a52ff26ec3c',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
  [NetworkId.SEJONG]: SEJONG_ADDRESSES,
};

export default addresses;
