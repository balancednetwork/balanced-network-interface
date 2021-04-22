export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const MAINNET_ADDRESSES = {
  loans: '',
  staking: '',
  dividends: '',
  reserve: '',
  rewards: '',
  dex: '',
  governance: '',
  band: '',
  sicx: '',
  bnusd: '',
  baln: '',
  bwt: '',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx89f109f7898d7e44f0caeab2b88f8fdd0b7b56ea',
  staking: 'cx26e0721cc7925836e0b5653d87348fd3f5a765f4',
  dividends: 'cx77dcbc1852aa3495dd472ca9a4486566e63ed007',
  reserve: 'cx118756bcbf8d8b8f6aa6941148ea8a7863d9ca91',
  rewards: 'cxa740cf5c443feb23491c5d24d75086dd576c2fa3',
  dex: 'cxcbf7b3994cbda4dcdfa9be610e20782f8171fcb0',
  governance: 'cxbcc157601376f60367851f8f17899c0a2c05fca5',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxec5403c48597577ebcc630e28e7d29610f24e7d5',
  bnusd: 'cx62b52d35a46b6a8bd4f741eb826c1403bc2227cc',
  baln: 'cx9aca494966a68ddbcb507915366d75adb37ba6ca',
  bwt: 'cxec33a32bb9f296edbb3f57a451b8ae36de1bbec2',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
