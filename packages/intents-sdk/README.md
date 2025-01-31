# Balanced Intent Solver SDK (Alpha)

Balanced Intent Solver SDK provides abstractions to assist you with interacting with the cross-chain Intent Smart Contracts and Solver.

**Note** SDK is currently in alpha testing stage and is subject to change!

## Installation

### NPM

Installing through npm:

`npm i --save @balancednetwork/intents-sdk`

**NOTE** Package is not yet published to the npm registry!!!

### Local

Package can be locally installed by following this steps:

1. Clone this repository to your local machine.
2. `cd` into repository folder location.
3. Execute `npm install` command in your CLI to install dependencies.
4. Execute `npm run build` to build the package.
5. In your app repository `package.json` file, define dependency named `"@balancednetwork/intents-sdk"` under `"dependencies"`.
   Instead of version define absolute path to your SDK repository `"file:<sdk-repository-path>"` (e.g. `"file:/Users/dev/balanced-solver-sdk"`).
   Full example: `"@balancednetwork/intents-sdk": "file:/Users/dev/balanced-solver-sdk"`.

## Local Development

How to setup local development

1. Clone repository.
2. Make sure you have [Node.js](https://nodejs.org/en/download/package-manager) v18+ and corresponding npm installed on your system.
3. Execute `npm install` command in your CLI to install dependencies.
4. Make code changes.
   1. Do not forget to export TS files in same folder `index.ts`.
   2. Always import files using `.js` postfix.
5. Before commiting execute `npm run prepublishOnly` in order to verify build, format and exports.

## Intent Solver Endpoints

Current Intent Solver API endpoints:
- **Production (mainnet)**: "https://solver.iconblockchain.xyz"
- **Staging** (mainnet): "https://staging-solver.iconblockchain.xyz"

**Note** Staging endpoint contains features to be potentially released and is subject to frequent change!

## Load SDK Config

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

```typescript
import { ChainName, ChainConfig, chainConfig, Token, IntentService } from "@balancednetwork/intents-sdk"

// instantiate intent service with config
const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

// all supported Intent chains
const supportedChains: ChainName[] = intentService.getSupportedChains()

// retrieve arbitrum chain config
const arbChainConfig: EvmChainConfig = intentService.getChainConfig("arb")

// example of how to construct token per chain map using supported chains array
const supportedTokensPerChain: Map<ChainName, Token[]> = new Map(
  supportedChains.map((chain) => {
    return [chain, intentService.getChainConfig(chain).supportedTokens]
  }),
)

// example of how to construct chain name to chain config map
const chainConfigs: Map<ChainName, ChainConfig> = new Map(
  supportedChains.map((chain) => {
    return [chain, intentService.getChainConfig(chain)]
  }),
)
```

## Request a Quote

Requesting a quote should require you to just consume user input amount and converting it to the appropriate token amount (scaled by token decimals).
All the required configurations (chain id [nid], token decimals and address) should be loaded as described in [Load SDK Config](#load-sdk-config).

```typescript
import { IntentService } from "@balancednetwork/intents-sdk"

const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

const quoteResult = await intentService.getQuote({
  token_src: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  token_src_blockchain_id: "0xa4b1.arbitrum",
  token_dst: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  token_dst_blockchain_id: "sui",
  src_amount: 100000000000000000n,
})

/**
 * Example response (quoteResult)
 * {
 *   "ok": true,
 *   "value": {
 *      "output": {
 *        "expected_output":"1000000000000", // to be used in create intent order as toAmount
 *        "uuid":"e2795d2c-14a5-4d18-9be6-a257d7c9d274" // to be used in create intent order as quote_uuid
 *      }
 *   }
 * }
 */
```

## Initialising Providers

SDK abstracts away the wallet and public RPC clients using `ChainProviderType` TS type which can be one of the following:

- `EvmProvider`: Provider used for EVM type chains (ETH, BSC, etc..). Implemented using [viem](https://viem.sh/docs/clients/wallet#json-rpc-accounts).
- `SuiProvider`: Provider used for SUI type chains (SUI). Implemented using [@mysten/sui](https://github.com/MystenLabs/sui) and [@mysten/wallet-standard](https://docs.sui.io/standards/wallet-standard).
- `IconProvider`: Provider used for ICON blockchain. Implemented using [icon-sdk-js](https://www.npmjs.com/package/icon-sdk-js).

Optionally, you can supply EVM providers (wallet and public clients) yourself (see `EvmInitializedConfig`).
SUI accepts only initialized Wallet, Account and Client.

Providers are used to request wallet actions (prompts wallet extension) and make RPC calls to the RPC nodes.

ICON Provider example:

```typescript
import { IconProvider } from "@balancednetwork/intents-sdk"

// uninitialized mainnet config
const iconProvider = new IconProvider({
  iconRpcUrl: "https://ctz.solidwallet.io/api/v3",
  iconDebugRpcUrl: "https://ctz.solidwallet.io/api/v3d",
  wallet: {
    address: "hx601020c5797Cdd34f64476b9bf887a353150Cb9a", // providing address assumes that browser wallet is connected
    // privateKey: "0x0000000000000000000000000000000000000000000000000000000000000000", // optional
  },
})

// initialized config
const iconProvider = new IconProvider({
  iconService: new IconService(new HttpProvider("https://lisbon.net.solidwallet.io/api/v3")),
  iconDebugRpcUrl: "https://lisbon.net.solidwallet.io/api/v3/debug",
  http: new HttpProvider("https://lisbon.net.solidwallet.io/api/v3"),
  wallet: "hx601020c5797Cdd34f64476b9bf887a353150Cb9a",// providing address assumes that browser wallet is connected, provide IconWallet instance in case of private key based initialization
})
```

EVM Provider example:

```typescript
import { EvmProvider } from "@balancednetwork/intents-sdk"

// NOTE: user address should be provided by application when user connects wallet
const evmProvider = new EvmProvider({
  userAddress: "0x601020c5797Cdd34f64476b9bf887a353150Cb9a",
  chain: "arb",
  provider: (window as any).ethereum,
})
```

SUI Provider example (uses [SUI dApp Kit](https://sdk.mystenlabs.com/dapp-kit/):

```typescript
import { SuiProvider } from "@balancednetwork/intents-sdk"
import { useCurrentWallet, useCurrentAccount } from "@mysten/dapp-kit"

const account = useCurrentAccount()
const { currentWallet, connectionStatus } = useCurrentWallet()

// check that wallet is connected and account is defined
if (connectionStatus === "connected" && account) {
  const suiProvider = new SuiProvider({ wallet, account, client })
} else {
  throw new Error("Wallet or Account undefined. Please connect wallet and select account.")
}
```

## Create Intent Order

Creating Intent Order requires creating provider for the chain that intent is going to be created on (`fromChain`).

Example for ARB -> SUI Intent Order:

```typescript
import { IntentService, EvmProvider, CreateIntentOrderPayload, IntentStatusCode } from "@balancednetwork/intents-sdk"

// instantiate intent service with config
const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

// create EVM provider because "arb" is of ChainType "evm" (defined in ChainConfig type - see section Load SDK Config)
// NOTE: window can only be accessed client side (browser)
const evmProvider = new EvmProvider({
  userAddress: "0x601020c5797Cdd34f64476b9bf887a353150Cb9a",
  chain: "arb",
  provider: (window as any).ethereum,
})

const intentOrderPayload: CreateIntentOrderPayload = {
  quote_uuid: "a0dd7652-b360-4123-ab2d-78cfbcd20c6b",
  fromAddress: "0x601020c5797Cdd34f64476b9bf887a353150Cb9a", // address we are sending funds from (fromChain)
  toAddress: "0x81600ec58a2efd97f41380370cddf25b7a416d03ee081552becfa9710ea30878", // destination address where funds are transfered to (toChain)
  fromChain: "arb", // ChainName
  toChain: "sui", // ChainName
  token: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
  amount: BigInt("100000000000000000"),
  toToken: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
  toAmount: BigInt("1000000000000"),
} as const

// checks if token transfer amount is approved (required for EVM, can be skipped for SUI as it defaults to true)
const isAllowanceValid = await intentService.isAllowanceValid(intentOrderPayload, evmProvider)

if (isAllowanceValid.ok) {
  if (!isAllowanceValid.value) {
    // allowance invalid, prompt approval
    const approvalResult = await intentService.approve(
      "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      BigInt("100000000000000000"),
      intentService.getChainConfig("arb").intentContract,
      evmProvider,
    )

    if (approvalResult.ok) {
      const executionResult = await intentService.executeIntentOrder(intentOrderPayload, evmProvider)

      if (executionResult.ok) {
        const intentStatus = await intentService.getStatus({
          task_id: executionResult.value.task_id,
        })

        if (intentStatus.ok) {
          console.log(intentStatus)

          /**
           * Example status
           * {
           *   "ok": true,
           *   "value": {
           *      "output": {
           *        "status":3, // use IntentStatusCode to map status code
           *        "tx_hash":"0xabcdefasdasdsafssadasdsadsadasdsadasdsadsa"
           *      }
           *   }
           * }
           */
        } else {
          // handle error
        }
      } else {
        // handle error
      }
    } else {
      // handle error
    }
  } else {
    // allowance is valid

    const executionResult = await intentService.executeIntentOrder(intentOrderPayload, evmProvider)
    // ...rest of result check and status check logic as above
  }
} else {
  // handle error
}
```

## Cancel Intent Order

Active Intent Order can be cancelled using order ID obtained as explained in [Get Intent Order](#get-intent-order).

Example cancel order:

```typescript
import { IntentService, SwapOrder, EvmProvider } from "@balancednetwork/intents-sdk"

// instantiate intent service with config
const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

const evmProvider = new EvmProvider({
   userAddress: "0x601020c5797Cdd34f64476b9bf887a353150Cb9a",
   chain: "arb",
   provider: (window as any).ethereum
})
const intentOrder: Result<SwapOrder> = await intentService.getOrder(
  "0xabcdefasdasdsafssadasdsadsadasdsadasdsadsa",
  intentService.getChainConfig("arb").intentContract,
  evmProvider,
)

if (intentOrder.ok) {
   const cancelResult: Result<string> = await intentService.cancelIntentOrder(
      intentOrder.value.id,
      "arb",
      evmProvider,
   )

   if (cancelResult.ok) {
      const txHash = cancelResult.value
      ..
   } else {
      // handle error
   }
} else {
   // handle error
}


```

## Get Intent Order

After the Intent order is created (`executeIntentOrder`), the resulting `txHash` can be used to query created on-chain order data.
Intent order id is assigned as a part of tx execution, thus if you want to grab an actual order id to be potentially canceled in future
you should invoke `intentService.getOrder(..)` function.

Example get order:

```typescript
import { IntentService, SwapOrder, EvmProvider } from "@balancednetwork/intents-sdk"

// instantiate intent service with config
const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

const evmProvider = new EvmProvider({
  userAddress: "0x601020c5797Cdd34f64476b9bf887a353150Cb9a",
  chain: "arb",
  provider: (window as any).ethereum,
})
const intentOrder: Result<SwapOrder> = await intentService.getOrder(
  "0xabcdefasdasdsafssadasdsadsadasdsadasdsadsa",
  intentService.getChainConfig("arb").intentContract,
  evmProvider,
)
```

## Get Intent Status

After Intent Order is created, the resulting `task_id` can be used to query the status of the task.

Example status check:

```typescript
import { IntentService } from "@balancednetwork/intents-sdk"

// instantiate intent service with config
const intentService = new IntentService({
  solverApiEndpoint: "https://solver.iconblockchain.xyz",
})

const intentStatus = await intentService.getStatus({
  task_id: "a0dd7652-b360-4123-ab2d-78cfbcd20c6b",
})

/**
 * Example intentStatus response
 * {
 *   "ok": true,
 *   "value": {
 *      "output": {
 *        "status":3, // use IntentStatusCode to map status code
 *        "tx_hash":"0xabcdefasdasdsafssadasdsadsadasdsadasdsadsa"
 *      }
 *   }
 * }
 */
```
