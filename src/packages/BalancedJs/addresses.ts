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
  loans: 'cxca3583ed5c2577c35fbc5d6018b7acc53b371dbd',
  staking: 'cx6008e00e91d4d54c0f111140880ccb0f50081714',
  dividends: 'cxbd0cf1843ef952ba4dd54eb5264a0fd0c2a95571',
  reserve: 'cx4d9bbd3d23117faea8bf5c1362fb11d5ebdbe2fa',
  daofund: 'cx59aeeea3f025686dfd4ce8639ffa24f421726b4c',
  rewards: 'cxde0d2b42b55b4e9305affc21dc4e7a4f01acf014',
  dex: 'cxb7aa0ad52cb09407f7730bc24697ee46a1afc16a',
  governance: 'cx231678864e72135bae7312b4b59c9902386b4987',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx53b3346dc782f26c4a686d537ef8fb38c4dba291',
  bnusd: 'cxb0a005e7741cd17e9b2e8afad3ede43001084727',
  baln: 'cx2d525581c442b7f885c289fe0d13db30c6ad2f58',
  bwt: 'cxc578f12080cf43c54104fca3d9a93f914d5d0c78',
  airdrip: 'cx8ed4fbee9d6497f91ea90933db288ff4b43e54ba',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
