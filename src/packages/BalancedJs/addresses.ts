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
  loans: 'cxb858032bd1af2547c1e0c985d492b6d2c93963e6',
  staking: 'cxa5dc5a7c23e51f5d60ce5cf9d9e8d9fb3aac0cfc',
  dividends: 'cxbdbac613e45c94c32f27f88987d01b2b16b67ec1',
  reserve: 'cx6be5461d45332d3acae9255e04186eb05299f167',
  daofund: 'cx06cde50bd80c412592d2e30cf21faf69a9c10300',
  rewards: 'cxaffb4ba2fd7373851b4418d22d267d8ee1f36719',
  dex: 'cx98e8d675f329778ffc16774913d106bd7eeae31c',
  governance: 'cx1851db9b584eb1f15103600775b07bd1ed7ba615',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx6ca5ad464a60469a1bc7aebdffee086b93f3e5c5',
  bnusd: 'cxa297f51cb8ee156db9a8c48a79c6acb753b8b713',
  baln: 'cx922425e694fdf3264e195b8bbd5fb9dc7edee345',
  bwt: 'cx35c2801d16eebeca9230c69c7108bdd0f8ca8ccb',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
