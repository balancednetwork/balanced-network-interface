export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: 'cx784f198d1b78fa12912fbda6edc38d9fb627067a',
  staking: 'cxc3733d7112d27e51490067af4f486da9380f1a41',
  dividends: 'cxd47dc3297a03f8245310994ccb5f7c166f1562e5',
  reserve: 'cx0af7adaef9fde9ce6dca17632dd5bbe6b0cb88c8',
  daofund: 'cxace1660691d27d12f638352fa6977329d3be9ab9',
  rewards: 'cxa81b648378628115071d216fbd7ba2e3657377b1',
  dex: 'cxc428e09c5f8783b0676e61ce83ca16bf6d7682fd',
  governance: 'cxfbec559c11a167191cdd88a9c1d4a292514a00cf',
  band: 'cxe647e0af68a4661566f5e9861ad4ac854de808a2',
  sicx: 'cx196fda5daa2de632d190b869a8501693ed93d3b7',
  bnusd: 'cx38aa1937a1da7031818ba68e2b9feb5fff3235ef',
  baln: 'cxe18cd2527e406cc6d79f4f40ff258ea0eb236219',
  bwt: 'cxbea02ccf3110273b4538af61e697eb6ff4eea156',
  airdrip: 'cxaf244cf3c7164fe6f996f398a9d99c4d4a85cf15',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx9075cb84b14f22c4d5b9ec6dfd3b469678dae646',
  staking: 'cx9fe774b5c89732cbff96f79f9f3c3ea784d1ced1',
  dividends: 'cxb8f87ba33c95f66857d3773783f4f1fefb629ca9',
  reserve: 'cxf0060f6023562a28a1b4bd2d182b06059f6a0b54',
  daofund: 'cxd27073fe645dfb1f626ca2dc09bd43fdd7f00b92',
  rewards: 'cx1335beb9e21e563062c92bc4907e45f21ea97425',
  dex: 'cx56ac679c8b67eebf6e0610f0d39ade9367777b7b',
  governance: 'cx7f5a051edd01ed4b14e938606805e261baa88137',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx7f5a051edd01ed4b14e938606805e261baa88137',
  bnusd: 'cx7f5a051edd01ed4b14e938606805e261baa88137',
  baln: 'cx7f5a051edd01ed4b14e938606805e261baa88137',
  bwt: 'cx7f5a051edd01ed4b14e938606805e261baa88137',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
