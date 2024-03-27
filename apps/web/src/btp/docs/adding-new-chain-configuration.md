## ADDING A NEW CHAIN

### Assumptions

A new chain:

- uses Metamask wallet
- has the same/closest ABI set with ICON-MOONBEAM BTP.

### Name Pattern

```
REACT_APP_CHAIN_[ID]_[PROPERTY]
```

- Prefix `REACT_APP_CHAIN`: is required for chain's configuration definition.
- ID: can be named to anything but it must has at least 3 characters (A-Z), unique and meanful to distinguish to other chains.

### Configuations

Add these `required` configurations folowing the name pattern above to `.env` file:

```javascript
REACT_APP_CHAIN_MOONBEAM_RPC_URL=https://moonbeam-alpha.api.onfinality.io/public
REACT_APP_CHAIN_MOONBEAM_NETWORK_ADDRESS=0x507.pra
REACT_APP_CHAIN_MOONBEAM_CHAIN_NAME=Moonbase Alpha
REACT_APP_CHAIN_MOONBEAM_COIN_SYMBOL=DEV
REACT_APP_CHAIN_MOONBEAM_GAS_LIMIT=6691B7
REACT_APP_CHAIN_MOONBEAM_BSH_CORE=0x910d65A483075CAfdFe5d3302909a42443DC5013
REACT_APP_CHAIN_MOONBEAM_BSH_ICX=0x7b329aA204fe2c790f714C5A25123bb2DaC86632
```

### Customization

Follow the ICON-MOONBEAM integration, a chain using Metamask wallet will have a ABI set below:

- `reclaim`(\_coinName: string, \_value: uint256)
- `transferNativeCoin`(\_to: string)
- `approve`(spender: address, amount: uint256)
- `transfer`(\_tokenName: string, \_value: uint256, \_to: string)
- `getBalanceOf`(\_owner: address, \_coinName: string)

A new chain should have the same ABI set to be the best compatible with BTP Dashboard. However, we allow to have some customization for name and params of methods.

Add your chain's customization to `chainCustomization.js` file in `/src/connectors`

```
import { ABITest } from 'connectors/MetaMask/ABITest';

export const customization = {
  [ID]: {
    ABI: ABITest,
    methods: {
      transferNativeCoin: {
        newName: 'abcTest',
        params: ({ recipientAddress, amount, coinName }) => ["btp://" + recipientAddress, amount],
      },
    },
  },
};
```

- `ID: string (required)`: Your chain's id in .env file, e.g: MOONBEAM
- `ABI: array (optional)`: List of ABIs, existing ABI will be overrided, a new ABI will be added. (/src/connectors/Metamask/ABI.js is an exmaple)
- `methods: object (optional)`: Place your customization on existing methods mentioned above here
  - `newName: string (optional)`: rename an existing method.
  - `params: function (options)`: customize a method's params. The function will receive the UI input's values as params and must return an array of customized params in order.
