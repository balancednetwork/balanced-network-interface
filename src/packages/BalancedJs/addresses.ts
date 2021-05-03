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
  loans: 'cxb64ab2fabf8c3913f13e1539d83ad452d0cc66d3',
  staking: 'cx979903fba7d55f232379fa7e4277627613acc200',
  dividends: 'cx62807833b9d4bc14b464d3862ad1ab4783434659',
  reserve: 'cxb893c070adc7929a54567aa2e5b30c5b220d9ea8',
  daofund: 'cx699f93242a3c7607f5a5f2b0f0f5586ee18b2c0f',
  rewards: 'cx2f28d57d01d4d9b5f71f65899249b4c9d00c847a',
  dex: 'cxefa12d7cbbddf59a17f5cd38ab0dfdb89bc9f1ea',
  governance: 'cxcaaedc54aef65e91fd004a82b800069895f9d4b4',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx77323d46115e243a18bd2b89dd9d756814f0e5a8',
  bnusd: 'cx00ca85d464d222931c8cffed0f788a9bc77b7cba',
  baln: 'cx6e9954176602078b74f297f502f9f057282a85b7',
  bwt: 'cx4cffd4d0e09ba45bdc2d677c74f94ad8f9d2075b',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
