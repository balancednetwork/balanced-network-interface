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
  loans: 'cx784f198d1b78fa12912fbda6edc38d9fb627067a',
  staking: 'cxc3733d7112d27e51490067af4f486da9380f1a41',
  dividends: 'cxd47dc3297a03f8245310994ccb5f7c166f1562e5',
  reserve: 'cx0af7adaef9fde9ce6dca17632dd5bbe6b0cb88c8',
  daofund: 'cxace1660691d27d12f638352fa6977329d3be9ab9',
  rewards: 'cxa81b648378628115071d216fbd7ba2e3657377b1',
  dex: 'cxc428e09c5f8783b0676e61ce83ca16bf6d7682fd',
  governance: 'cxfbec559c11a167191cdd88a9c1d4a292514a00cf',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx196fda5daa2de632d190b869a8501693ed93d3b7',
  bnusd: 'cx38aa1937a1da7031818ba68e2b9feb5fff3235ef',
  baln: 'cxe18cd2527e406cc6d79f4f40ff258ea0eb236219',
  bwt: 'cxbea02ccf3110273b4538af61e697eb6ff4eea156',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
