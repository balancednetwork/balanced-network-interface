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
  loans: 'cx9e7b574872590543f67b928d4b33ceb5f55b703e',
  staking: 'cxeee5e9bd5e42a81dbd5b176b28c20cb39e1245fe',
  dividends: 'cxde09580393c178e8ea05216d95baf81071208137',
  reserve: 'cx0fe9809ac3bb89e3cfbf61f43a1f2fa6a48357d1',
  daofund: 'cx7427a0b0c98118dd6954d5784d8f7eaedac84b5c',
  rewards: 'cx51f51e48a641a04d3a1582c6cdff456e0943a2e0',
  dex: 'cx2f0af5ce9e1430c264812157c8c327ef9f8ff6c2',
  governance: 'cxd63faf33f127c3726c5f057b86b79a4615051236',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx997ea6b114cd5ececb4c1153eb6af934e1044250',
  bnusd: 'cxc3dabd2fb247606558295982955b296cd693d122',
  baln: 'cx9885971ecaee9e4f89cfd2db6bc2039b63c9fb69',
  bwt: 'cx87367a1499eea30059110dd29c1d255d016f00fb',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
