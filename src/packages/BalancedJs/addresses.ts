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
