export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: 'cx66d4d90f5f113eba575bf793570135f9b10cece1',
  staking: 'cx43e2eec79eb76293c298f2b17aec06097be606e0',
  dividends: 'cx203d9cd2a669be67177e997b8948ce2c35caffae',
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
  loans: 'cx404273fb03fc41ef796aa73976608adf345a3ad5',
  staking: 'cxb02f4c88c56009c6e67682561c55b5b58e20b55b',
  dividends: 'cx6edcf01ad2e0a9611bb896a9eb3fb5b49dfe79cd',
  reserve: 'cx9240c5deeafa6a544d7dca52302c9f2558672f2c',
  daofund: 'cx46f37b8fab0c70d337309bc7e5a190fccd504419',
  rewards: 'cxc59290cbd6ab3cdb64755db6f50ec01fbb251032',
  dex: 'cxf1fd4cdee6973c6f7999e78cda0762874a4ca08a',
  governance: 'cx5e3b1505e030c7d91c99bf2c6c41a0c3c7a81b89',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx4b2909fcadd24decd719d6e759020c8c7da1abab',
  bnusd: 'cxad33781772854b91a61de686ebbadd5ec676eeb0',
  baln: 'cx1c6c6a25f5b6d7c7d580d0dbcd6aa56f8c9c5134',
  bwt: 'cx5e8889cb30693e0a1d423aa7661c5d0ca23eb748',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
