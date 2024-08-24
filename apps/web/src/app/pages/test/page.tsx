import React from 'react';
import { Flex } from 'rebass/styled-components';

import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';

import { Button } from '@/app/components/Button';
import { useIconReact } from '@/packages/icon-react';

import { openToast } from '@/btp/src/connectors/transactionToast';
import { injective, xChains } from '@/constants/xChains';
import { TransactionStatus } from '@/lib/xcall/_zustand/types';
import { AllPublicXServicesCreator } from '@/lib/xcall/_zustand/useXServiceStore';
import { useInjectiveWalletStore, walletStrategy } from '@/packages/injective';
import { tryParseAmount } from '@/store/swap/hooks';

import {
  ChainGrpcBankApi,
  IndexerGrpcAccountPortfolioApi,
  IndexerRestExplorerApi,
  MsgExecuteContractCompat,
  fromBase64,
  toBase64,
} from '@injectivelabs/sdk-ts';

import { NATIVE_ADDRESS } from '@/constants';
import { getBytesFromString } from '@/lib/xcall/utils';
import { XToken } from '@/types';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';
import { EthereumChainId } from '@injectivelabs/ts-types';
import { MsgBroadcaster } from '@injectivelabs/wallet-ts';

export const NETWORK = Network.Mainnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);

export const chainGrpcWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);
const indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(ENDPOINTS.indexer);
const chainGrpcBankApi = new ChainGrpcBankApi(ENDPOINTS.grpc);
const indexerRestExplorerApi = new IndexerRestExplorerApi(`${ENDPOINTS.explorer}/api/explorer/v1`);

const INJ = new Token(ChainId.MAINNET, 'cx4297f4b63262507623b6ad575d0d8dd2db980e4e', 18, 'HVH', 'Havah Token');
const xINJ = new XToken('injective-1', 'injective-1', NATIVE_ADDRESS, 18, 'INJ', 'INJ');

const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  endpoints: ENDPOINTS,
  ethereumChainId: EthereumChainId.Sepolia,
});

async function fetchBnUSDBalance(address) {
  try {
    const response: any = await chainGrpcWasmApi.fetchSmartContractState(
      injective.contracts.bnUSD!,
      toBase64({ balance: { address } }),
    );

    const result = fromBase64(response.data);
    console.log('result', result);
  } catch (e) {
    alert((e as any).message);
  }
}

export function TestPage() {
  const { account } = useIconReact();
  const { account: accountInjective } = useInjectiveWalletStore();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const bridge = async (currency: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    if (!accountInjective) {
      openToast({
        message: `Please connect wallet!`,
        transactionStatus: TransactionStatus.failure,
      });
      return;
    }

    setIsProcessing(true);

    // openToast({
    //   id: `swap-${currencyIn.symbol}-${currencyOut.symbol}`,
    //   message: `Swapping ${currencyIn.symbol} for ${currencyOut.symbol}...`,
    //   transactionStatus: TransactionStatus.pending,
    // });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    try {
      // const xcallfee = await havahJs.XCall.getFee('0x1.icon', true);

      // console.log('xcallfee', xcallfee);

      const currencyAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currency);

      if (!currencyAmount) {
        throw new Error('Invalid amount');
      }

      const destination = `0x1.icon/${account}`;
      const xCallFee = {
        rollback: BigInt(100_000_000),
      };

      // const msg = MsgSend.fromJSON({
      //   amount: {
      //     denom: 'inj',
      //     amount: new BigNumberInBase(0.01).toWei().toFixed(),
      //   },
      //   srcInjectiveAddress: accountInjective,
      //   dstInjectiveAddress: 'inj1d30erltgm4an5xhdkrcfj3n9jfe02gaymh4056',
      // });
      const data = getBytesFromString(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: destination,
          },
        }),
      );
      const msg = MsgExecuteContractCompat.fromJSON({
        contractAddress: injective.contracts.assetManager,
        sender: accountInjective,
        msg: {
          // deposit: {
          //   token_address: xINJ.address,
          //   amount: currencyAmount.quotient.toString(),
          //   to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          //   data,
          // },

          deposit_denom: {
            denom: 'inj',
            to: '0x1.icon/hxe25ae17a21883803185291baddac0120493ff706',
            data: [],
          },
        },
        funds: [
          {
            denom: 'inj',
            amount: '4526360000000000',
          },
        ],
      });

      // console.log('accountInjective', accountInjective);

      // console.log('aaa', getEthereumSignerAddress(accountInjective));
      // console.log('bbb', getInjectiveSignerAddress(accountInjective));

      // console.log('isCosmosWallet', isCosmosWallet(walletStrategy.wallet));

      // const portfolio = await indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(accountInjective);
      // console.log(portfolio);

      // const balances = await chainGrpcBankApi.fetchBalances(accountInjective);
      // console.log(balances);

      // await fetchBnUSDBalance(accountInjective);

      // const txResult = await msgBroadcastClient.broadcast({
      //   msgs: msg,
      //   injectiveAddress: accountInjective,
      //   gas: {
      //     gas: 1200_000,
      //   },
      // });
      // console.log('txResult', txResult);
    } catch (e) {
      console.error('error', e);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    setIsProcessing(false);
  };

  const handleBridgeINJFromInjectiveToIcon = async () => {
    console.log('handleBridgeINJFromInjectiveToIcon');
    await bridge(INJ, '1');
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <AllPublicXServicesCreator xChains={xChains} />
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleBridgeINJFromInjectiveToIcon} disabled={isProcessing}>
          Bridge INJ from Injective to ICON
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
