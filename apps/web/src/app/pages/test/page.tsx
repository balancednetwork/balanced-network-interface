import React from 'react';
import { Flex, Box } from 'rebass/styled-components';

import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@balancednetwork/sdk-core';
import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { Pair, Trade } from '@balancednetwork/v1-sdk';
import bnJs from 'bnJs';
import BigNumber from 'bignumber.js';

import { Button } from 'app/components/Button';
import { useIconReact } from 'packages/icon-react';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { TransactionStatus } from '../trade/bridge/_zustand/types';
import { openToast } from 'btp/src/connectors/transactionToast';
import { NULL_CONTRACT_ADDRESS } from 'constants/tokens';
import { getAllCurrencyCombinations } from 'hooks/useAllCurrencyCombinations';
import { PairState, fetchV2Pairs } from 'hooks/useV2Pairs';
import { tryParseAmount } from 'store/swap/hooks';
import { isTradeBetter } from 'utils/isTradeBetter';
import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from 'constants/misc';
import { formatBigNumber, toDec } from 'utils';
import { DEFAULT_SLIPPAGE } from 'constants/index';
import { getRlpEncodedMsg } from 'app/pages/trade/bridge/utils';

const ICX = new Token(ChainId.MAINNET, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
const bnUSD = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD', 'Balanced Dollar');
const BALN = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].baln, 18, 'BALN', 'Balance Token');

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const calculateTrade = async (
  currencyIn: Currency,
  currencyOut: Currency,
  currencyInValue: string,
  maxHops = 3,
): Promise<Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined> => {
  const currencyAmountIn: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currencyIn);

  const allCurrencyCombinations = getAllCurrencyCombinations(currencyIn, currencyOut);
  const allPairs = await fetchV2Pairs(allCurrencyCombinations);

  const pairs = allPairs
    .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
    .map(([, pair]) => pair);

  console.log('pairs', pairs);

  if (currencyAmountIn && currencyOut && pairs.length > 0) {
    if (maxHops === 1) {
      return (
        Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[1]?.[0] ??
        undefined
      );
    }
    // search through trades with varying hops, find best trade out of them
    let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined = undefined;
    const trades = Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, {
      maxHops: maxHops,
      maxNumResults: 1,
    });
    for (let i = 1; i <= maxHops; i++) {
      const currentTrade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined = trades[i]?.[0] ?? undefined;
      // if current trade is best yet, save it
      if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
        bestTradeSoFar = currentTrade;
      }
    }
    return bestTradeSoFar;
  }

  return undefined;
};

function getBytesFromNumber(value) {
  const hexString = value.toString(16).padStart(2, '0');
  return Buffer.from(hexString.length % 2 === 1 ? '0' + hexString : hexString, 'hex');
}

function getBytesFromAddress(address) {
  return Buffer.from(address.replace('cx', '01'), 'hex');
}

type RouteAction = {
  type: number;
  address: string;
};

export function foo(method: string, recipient: string, minimumReceive: BigInt, _path: RouteAction[]) {
  const data: any[] = [
    Buffer.from(method, 'utf-8'),
    Buffer.from(recipient, 'utf-8'),
    getBytesFromNumber(minimumReceive),
  ];

  for (let i = 0; i < _path.length; i++) {
    data.push([getBytesFromNumber(_path[i].type), getBytesFromAddress(_path[i].address)]);
  }

  return Buffer.from(getRlpEncodedMsg(data)).toString('hex');
}

export function TestPage() {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  useFetchBBalnInfo(account);
  useWalletFetchBalances(account, accountArch);
  useFetchRewardsInfo();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const swap = async (currencyIn: Currency, currencyOut: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    if (!account) {
      openToast({
        message: `Please connect wallet!`,
        transactionStatus: TransactionStatus.failure,
      });
      return;
    }

    setIsProcessing(true);

    openToast({
      id: `swap-${currencyIn.symbol}-${currencyOut.symbol}`,
      message: `Swapping ${currencyIn.symbol} for ${currencyOut.symbol}...`,
      transactionStatus: TransactionStatus.pending,
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////
    const executionTrade = await calculateTrade(currencyIn, currencyOut, currencyInValue);

    if (!executionTrade) {
      openToast({
        id: `swap-${currencyIn.symbol}-${currencyOut.symbol}`,
        message: `No trade found.`,
        transactionStatus: TransactionStatus.failure,
      });
      setIsProcessing(false);
      return;
    }

    const slippageTolerance = new Percent(DEFAULT_SLIPPAGE, 10_000);
    const minReceived = executionTrade.minimumAmountOut(slippageTolerance);
    console.log('slippageTolerance', slippageTolerance.toSignificant(4));
    console.log('minReceived', minReceived.toExact());
    console.log('trade', executionTrade.route.path);

    const recipient = account;
    try {
      if (executionTrade.inputAmount.currency.symbol === 'ICX') {
        const res = await bnJs
          .inject({ account })
          .Router.swapICX(
            toDec(executionTrade.inputAmount),
            executionTrade.route.pathForSwap,
            toDec(minReceived),
            recipient,
          );

        console.log('res', res);
        console.log('hash', res.result);
      } else {
        const token = executionTrade.inputAmount.currency as Token;
        const outputToken = executionTrade.outputAmount.currency as Token;

        const rlpEncodedSwapData = foo(
          '_swap',
          recipient,
          BigInt(toDec(minReceived)),

          //@ts-ignore
          executionTrade.route.pathForSwap.map(x => ({
            type: 1,
            address: x,
          })),
        );

        console.log('rlpEncodedSwapData', rlpEncodedSwapData);

        // throw new Error('Not implemented');

        console.log('toDec(executionTrade.inputAmount)', toDec(executionTrade.inputAmount));

        const res = await bnJs
          .inject({ account })
          .getContract(token.address)
          .swapUsingRoute2(toDec(executionTrade.inputAmount), rlpEncodedSwapData);

        // const res = await bnJs
        //   .inject({ account })
        //   .getContract(token.address)
        //   .swapUsingRoute(
        //     toDec(executionTrade.inputAmount),
        //     outputToken.address,
        //     toDec(minReceived),
        //     executionTrade.route.pathForSwap,
        //     recipient,
        //   );
        console.log('res', res);
        console.log('hash', res.result);
      }

      const _inputAmount = formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency');
      const _outputAmount = formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency');
      openToast({
        id: `swap-${currencyIn.symbol}-${currencyOut.symbol}`,
        message: `Swapped ${_inputAmount} ${currencyIn.symbol} for ${_outputAmount} ${currencyOut.symbol}.`,
        transactionStatus: TransactionStatus.success,
      });
    } catch (e) {
      console.error('error', e);

      openToast({
        id: `swap-${currencyIn.symbol}-${currencyOut.symbol}`,
        message: `Error swapping ${currencyIn.symbol} for ${currencyOut.symbol}.`,
        transactionStatus: TransactionStatus.failure,
      });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    setIsProcessing(false);
  };

  const handleShowTradeICXForbnUSD = async () => {
    const trade = await calculateTrade(ICX, bnUSD, '1');

    if (trade) {
      const slippageTolerance = new Percent(DEFAULT_SLIPPAGE, 10_000);
      const minReceived = trade.minimumAmountOut(slippageTolerance);
      console.log('slippageTolerance', slippageTolerance.toSignificant(4));
      console.log('minReceived', minReceived.toExact());
      console.log('trade', trade.route.path);
    } else {
      console.log('No trade found');
    }
  };

  const handleSwapICXForbnUSD = async () => {
    console.log('handleSwapICXForbnUSD');
    await swap(ICX, bnUSD, '1');
  };

  const handleSwapBALNForbnUSD = async () => {
    console.log('handleSwapBLANForbnUSD');
    await swap(BALN, bnUSD, '2');
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeICXForbnUSD} disabled={isProcessing}>
          Show Trade for swapping ICX for bnUSD
        </Button>
        <Button onClick={handleSwapICXForbnUSD} disabled={isProcessing}>
          Swap ICX for bnUSD
        </Button>
      </Flex>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        {/* <Button onClick={handleShowTradeICXForbnUSD} disabled={isProcessing}>
          Show Trade for swapping ICX for bnUSD
        </Button> */}
        <Button onClick={handleSwapBALNForbnUSD} disabled={isProcessing}>
          Swap BALN for bnUSD
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
