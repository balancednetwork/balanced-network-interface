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
  loans: 'cxf8c5ddc44562f317f78b8e737f2bea62076b007a',
  staking: 'cxae397689b2c126a48ea894c3c2997af218a368c6',
  dividends: 'cx3dfd8c9a6f84a997ce08a1aba5ed7614c2f92077',
  reserve: 'cx284fe6ae668f8f623726d40d0fe1ed860e25f118',
  daofund: 'cx55d6f8ace087ba016ce6308af4bd7a40b734bc56',
  rewards: 'cx8ba65e73fada70a56f1c7bdc8305597b8acf2273',
  dex: 'cxe50b95fa0165ee6e87dcd50041bf72023ab34b38',
  governance: 'cx6f72834d36c78468ca097c1b5377c98a7286b60b',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx4bf512cf4ecb5fd8fead46177f377a71d8806cee',
  bnusd: 'cx29e6404d86c196e245837fcf170bb1c7016dd8e3',
  baln: 'cx273519c7ad59ace0bcd7f3039d7063451ea9d46a',
  bwt: 'cx8b889ae9586f3257ed89d3da6a0cfffa2b6ae250',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
