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
  daofund: '',
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
  loans: 'cx1c4051c72647b8da32f128d2034e10c36a746519',
  staking: 'cxa9f43524798efbdab0533d8bbbd6ccc68b879b59',
  dividends: 'cx7cd77844be7e1a5daf387524956acb80c9dc4ec3',
  reserve: 'cx25e6ad96e337d35687ab5c607db06c7e4a88cb6a',
  daofund: 'cx71fe767de1463679e2c8c5d4c48511fec43b8f31',
  rewards: 'cx281480a9e2af76f2f2601db0a76b7639d1f837a5',
  dex: 'cxf81975ac3018efcd1fe37582651c488f0ed3aa3c',
  governance: 'cxc3b5b44416dbca743ebc03aad96e92682ac5d22a',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cxdf78ef450c2c66ae1378544934bfc71b7fdc68a7',
  bnusd: 'cx2b8e6ce62ebd9acab61c67d4d3f1c9106f4f55c8',
  baln: 'cxd2b3caab41b64991ba736b557ecffa775726dc28',
  bwt: 'cxeb1879e7fbeba5c845b629eb15e81edafc4223d1',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
