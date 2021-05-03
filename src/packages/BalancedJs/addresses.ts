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
  loans: 'cxebc0625cb87f98f207aa76e2a1b53893dc587597',
  staking: 'cxd7aa64a368b6abe31fef1d75052e2dcae8d60026',
  dividends: 'cxb2ead0a9729a14d9186554fdfe630cc481c12d93',
  reserve: 'cx70a8bc0145f71959a47f51ec023619ce5a6c8f68',
  daofund: 'cxf5672df567bbec8a9bf0b20cf23b73c4e7170008',
  rewards: 'cxa5b0d5e8a7e265d089b9b5a0286c84ee06452f04',
  dex: 'cx40ccfa9ae2b459d66d377b0d6d72757f4c2e443e',
  governance: 'cx3d2b73ee631467e2b1b239bd265017fdc2ac6412',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx4e02db2369fe0d667e3e2e1264e93f1f619d830f',
  bnusd: 'cxf90064499f7e724d25a522e287268c12b98bb2ab',
  baln: 'cx780e23aa6f7ad6116f6e604d1c63a1beb7dacc1a',
  bwt: 'cx780e23aa6f7ad6116f6e604d1c63a1beb7dacc1a',
  airdrip: 'cxdc9ae94a3fc7d8fbb558f7d7f94b2d0e4e6e346c',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
