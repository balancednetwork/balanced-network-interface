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
  loans: 'cx7aef5d8a83327a649904a919c1ec87f10ce734f9',
  staking: 'cxe96eb3da182ba7943a97caf6d9a18065bd8b220a',
  dividends: 'cx6f5a2e3c4e25b3b548cd1e122aa32eb32c1f6dce',
  reserve: 'cx630e5cba5317f7f5741d9f5be0b830a96c7000c4',
  daofund: 'cxcf54974d450234223a2f59e713847185ab1ad9a8',
  rewards: 'cx97d8e0da265f147623893cb445f05c81c2e9f814',
  dex: 'cxaa00aa510d44076fdca14f7aebe307f2872becb0',
  governance: 'cxb6f0f6149cda7a861c808498b5802a51b719ab4e',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx8e58d166790d6292931e9d7ac764be8b4496c290',
  bnusd: 'cxe74d7522a8835f190e6edbe07563e7ad357b1f52',
  baln: 'cxa144ae379cf5158092028a671d0b61f9d85a9302',
  bwt: 'cx08791ea464ad76059b4cc2663594f3c91314b2d7',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
