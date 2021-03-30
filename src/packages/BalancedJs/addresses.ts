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
  bnUSD: '',
  baln: '',
  bwt: '',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx2594f06f668fa84804d94c1e5d4b378bfcf23b42',
  staking: 'cx00093ced37e5c42b995c4df95fa0ce32290c9a36',
  dividends: 'cx39779100a6556ab3d161dfc95dab3839ac632c9a',
  reserve: 'cx6dd23ec8b6dc6f6c3dec784e200c097f842b8716',
  rewards: 'cxdd1516deed20d0dca0b7ef8c19d2273c48406e86',
  dex: 'cx774ddaf4e885782b56c2ddb1df8d8ce3f9ade09e',
  governance: 'cx637d21599c04a4c93b390c7f9efb9e7c3a7fcfbb',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx2e94568da72a0e4caf58d2baa1366476f05955ef',
  bnUSD: 'cx04afcd84c96ee03b30f6f88a60b2a1dee76c63fd',
  baln: 'cx66e56c4ed8a0e7da280867707dcd1ba9322d8c60',
  bwt: 'cx31bd70011e8ce26cb397ec017a339aabc7e7d049',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
