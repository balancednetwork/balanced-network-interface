import React from 'react';
import { Flex } from 'rebass/styled-components';

import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@balancednetwork/sdk-core';
import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { havahJs } from '@/bnJs';

import { Button } from '@/app/components/Button';
import { useIconReact } from '@/packages/icon-react';
import { TransactionStatus } from '../trade/bridge/_zustand/types';
import { openToast } from '@/btp/src/connectors/transactionToast';
import { NULL_CONTRACT_ADDRESS } from '@/constants/tokens';
import { AllPublicXServicesCreator, xServiceActions } from '../trade/bridge/_zustand/useXServiceStore';
import { injective, xChains } from '../trade/bridge/_config/xChains';
import { tryParseAmount } from '@/store/swap/hooks';
import { useInjectiveWalletStore, walletStrategy } from '@/packages/injective';

import {
  IndexerGrpcAccountPortfolioApi,
  MsgExecuteContractCompat,
  MsgSend,
  fromBase64,
  getEthereumSignerAddress,
  getInjectiveAddress,
  getInjectiveSignerAddress,
  toBase64,
} from '@injectivelabs/sdk-ts';
import { BigNumberInBase } from '@injectivelabs/utils';

import { ChainGrpcWasmApi } from '@injectivelabs/sdk-ts';
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { isCosmosWallet, MsgBroadcaster } from '@injectivelabs/wallet-ts';

export const NETWORK = Network.Testnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);

// export const chainGrpcWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);
const indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(ENDPOINTS.indexer);

const INJ = new Token(ChainId.MAINNET, 'cx4297f4b63262507623b6ad575d0d8dd2db980e4e', 18, 'HVH', 'Havah Token');

const msgBroadcastClient = new MsgBroadcaster({
  walletStrategy,
  network: NETWORK,
  endpoints: ENDPOINTS,
});

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

      const msg = MsgSend.fromJSON({
        amount: {
          denom: 'inj',
          amount: new BigNumberInBase(0.01).toWei().toFixed(),
        },
        srcInjectiveAddress: accountInjective,
        dstInjectiveAddress: accountInjective,
      });

      console.log('accountInjective', accountInjective);

      console.log('aaa', getEthereumSignerAddress(accountInjective));
      console.log('bbb', getInjectiveSignerAddress(accountInjective));

      console.log('isCosmosWallet', isCosmosWallet(walletStrategy.wallet));

      const portfolio = await indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(accountInjective);
      console.log(portfolio);

      const txResult = await msgBroadcastClient.broadcast({
        msgs: msg,
        injectiveAddress: accountInjective,
      });
      console.log('txResult', txResult);
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
