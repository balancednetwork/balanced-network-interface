## Transfer tokens on localnet guidelines

### Playground

- Team testing: http://demo-static-web.lecle.vn.s3-website-ap-southeast-1.amazonaws.com/transfer
- Official testnet URL: http://testnet.nexusportal.io/transfer

### Connect wallets to testnet

#### 1. ICONex

**Does not require extra setup to connect this wallet to the testnet for transfer testing**. Just install, and load a wallet (using a keystore or a private key). Here is a ready-to-go account:

**alice.ks.json**

```json
{
  "address": "hx2c8475a80bb72a95886b8986672f102d485b4de2",
  "id": "a80f822d-ca9c-4d00-b3d2-5ba0c3680c48",
  "version": 3,
  "coinType": "icx",
  "crypto": {
    "cipher": "aes-128-ctr",
    "cipherparams": {
      "iv": "dfe98656ae19118a067d5343f3dc7c82"
    },
    "ciphertext": "3634ab7b0ad70c8dbfe03f6141c71583b41377b7aeeb490d67cff7343ce7ac90",
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 65536,
      "r": 8,
      "p": 1,
      "salt": "fba7c21c9627ffe8"
    },
    "mac": "1c7ee22411028ace3c7a8ce8ab83adaf764412a5df51daf18833ebaeb42c9b82"
  }
}
```

- pw: 0fce2036c36ec3d8

**Faucet:** https://faucet.ibriz.ai/

#### 2. MetaMask

- Install & load wallet: https://docs.moonbeam.network/getting-started/local-node/using-metamask/

- Testing account: BOB - Private key: 0x4becbf3d80360c79447fd085971455e2e1970e64678eb546a3b9811219b67475

- Switch to Moonbeam testnet: https://metamask.zendesk.com/hc/en-us/articles/360043227612-How-to-add-custom-Network-RPC

**Moonbeam testnet:**

- Name: Moonbase
- New RPC URL: https://moonbeam-alpha.api.onfinality.io/public
- Chain ID: 1287
- Symbol: DEV

- Faucet: https://docs.moonbeam.network/builders/get-started/moonbase/#get-tokens
