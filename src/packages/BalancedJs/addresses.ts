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
  loans: 'cxe809a61f33ed3f42853b239c4516086b992b1fb7',
  staking: 'cx135987257c61b3c06cdc0e7b05e3fd50bc68ddc4',
  dividends: 'cxd66cb3bffc94edc13e9212062f6efc782ca01ba4',
  reserve: 'cxc0edbce35b70ef4ca008c0c135bf7e12caff533a',
  rewards: 'cx03a8b54115f9caeb96b04802e233c5f52da5381d',
  dex: 'cxb6a9734dc225ac4c1de7328b42611063272c36a0',
  governance: 'cxd1ee7350a86182c814999080e173e965ed4fbf1b',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  sicx: 'cx5ddf1b9ad1b6a9711371e7b98e85b23d761e9e70',
  bnUSD: 'cx8f4bd0bad027e7716e238d3f71ad5a313c852fba',
  baln: 'cxc58cd24c48f9d4fa0ecfb7b0598666a898e9e5fe',
  bwt: 'cxf8e3f765de81f6588f862988f5c0674e5ecb0cdc',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
};

export default addresses;
