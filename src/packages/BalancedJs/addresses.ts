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
  loans: 'cxd7cfc1fc0c71d30039fc82eb5244ffbd2e695ef5',
  staking: 'cx1666c9314e05bdc6af20d3d7ebc9c500c987e475',
  dividends: 'cx60cbfeb36c11d33bd613b625af29312172bb46a6',
  reserve: 'cxbfc43d23d844ed1966c5ee2fdeae83f17e549aac',
  daofund: 'cxc01cd059b544d9a0539f93ac968127c9befc32ca',
  rewards: 'cxe74f75cbd77c7138b2a0c739ef7b7b7180dd583a',
  dex: 'cx62db8eb4e0012a20261bddd18a57234c0a007d89',
  governance: 'cx54f7f31c98c6925a7fd856e573169b22f12d26df',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx15608353b0ec85cca7d2d46167c563d1f3139830',
  bnusd: 'cx508579fea8cc45448dc338b6212ce24c98ee42e7',
  baln: 'cxa4b0ec4e321821b6e526a05b8097b5941fae2f49',
  bwt: 'cx40915204e57e85003d910ca4d074c9a25d32c80c',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
