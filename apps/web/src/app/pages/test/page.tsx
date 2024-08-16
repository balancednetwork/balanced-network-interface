import React from 'react';
import { Box, Flex } from 'rebass/styled-components';

import bnJs from '@/bnJs';
import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@balancednetwork/sdk-core';
import { Pair, Trade } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';

import { Button } from '@/app/components/Button';
import { openToast } from '@/btp/src/connectors/transactionToast';
import { DEFAULT_SLIPPAGE } from '@/constants/index';
import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from '@/constants/misc';
import { NULL_CONTRACT_ADDRESS } from '@/constants/tokens';
import { xChains } from '@/constants/xChains';
import { getAllCurrencyCombinations } from '@/hooks/useAllCurrencyCombinations';
import { PairState, fetchStabilityFundPairs, fetchV2Pairs } from '@/hooks/useV2Pairs';
import { TransactionStatus } from '@/lib/xcall/_zustand/types';
import { AllPublicXServicesCreator, xServiceActions } from '@/lib/xcall/_zustand/useXServiceStore';
import { useIconReact } from '@/packages/icon-react';
import { useFetchBBalnInfo } from '@/store/bbaln/hooks';
import { useFetchRewardsInfo } from '@/store/reward/hooks';
import { tryParseAmount } from '@/store/swap/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';
import { formatBigNumber, toDec } from '@/utils';
import { isTradeBetter } from '@/utils/isTradeBetter';
import { getRlpEncodedSwapData } from '../../../lib/xcall/utils';

const ICX = new Token(ChainId.MAINNET, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
const bnUSD = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD', 'Balanced Dollar');
const BALN = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].baln, 18, 'BALN', 'Balance Token');
const USDC = new Token(ChainId.MAINNET, 'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f', 6, 'USDC', 'Archway USDC');

const calculateTrade = async (
  currencyIn: Currency,
  currencyOut: Currency,
  currencyInValue: string,
  maxHops = 3,
): Promise<Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined> => {
  const currencyAmountIn: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currencyIn);

  const allCurrencyCombinations = getAllCurrencyCombinations(currencyIn, currencyOut);
  const allPairs = await fetchV2Pairs(allCurrencyCombinations);
  const stabilityFundPairs = await fetchStabilityFundPairs();

  const pairs = allPairs
    .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
    .map(([, pair]) => pair)
    .concat(stabilityFundPairs);

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
    if (bestTradeSoFar) {
      const trade = bestTradeSoFar;
      const slippageTolerance = new Percent(DEFAULT_SLIPPAGE, 10_000);
      const minReceived = trade.minimumAmountOut(slippageTolerance);
      console.log('slippageTolerance', slippageTolerance.toSignificant(4));
      console.log('minReceived', minReceived.toSignificant(4));
      console.log('trade route path', trade.route.path);
      console.log('rlp encoded route path', getRlpEncodedSwapData(trade).toString('hex'));
      console.log(
        'trade route pairs',
        trade.route.pairs.map((pair, index) =>
          trade.route.path[index].equals(pair.token1)
            ? pair.token1.symbol + (pair.isStabilityFund ? ' **> ' : '-->') + pair.token0.symbol
            : pair.token0.symbol + (pair.isStabilityFund ? ' **> ' : '-->') + pair.token1.symbol,
        ),
      );
      console.log('trade priceImpact', trade.priceImpact.toSignificant(4));

      console.log('trade mid price', trade.route.midPrice.toDebugString());
      console.log('trade execution price', trade.executionPrice.toDebugString());
      console.log('trade input amount', trade.inputAmount.toExact());
      console.log('trade output amount', trade.outputAmount.toExact());
      console.log('trade fee', trade.fee.toExact());
    }
    return bestTradeSoFar;
  }

  return undefined;
};

export function TestPage() {
  const { account } = useIconReact();
  useFetchBBalnInfo(account);
  useWalletFetchBalances();
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

    const recipient = account;
    try {
      if (executionTrade.inputAmount.currency.symbol === 'ICX') {
        const rlpEncodedPath = getRlpEncodedSwapData(executionTrade).toString('hex');

        const res = await bnJs
          .inject({ account })
          .Router.swapICXV2(toDec(executionTrade.inputAmount), rlpEncodedPath, toDec(minReceived), recipient);

        console.log('res', res);
        console.log('hash', res.result);
      } else {
        const token = executionTrade.inputAmount.currency as Token;
        const outputToken = executionTrade.outputAmount.currency as Token;

        const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', recipient, minReceived).toString('hex');
        console.log('rlpEncodedSwapData', rlpEncodedData);

        const res = await bnJs
          .inject({ account })
          .getContract(token.address)
          .swapUsingRouteV2(toDec(executionTrade.inputAmount), rlpEncodedData);

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

    if (!trade) {
      console.log('No trade found');
    }
  };

  const handleSwapICXForbnUSD = async () => {
    console.log('handleSwapICXForbnUSD');
    await swap(ICX, bnUSD, '1');
  };

  const handleShowTradeICXForUSDC = async () => {
    const trade = await calculateTrade(ICX, USDC, '1');

    if (!trade) {
      console.log('No trade found');
    }
  };

  const handleSwapICXForUSDC = async () => {
    console.log('handleSwapICXForUSDC');
    await swap(ICX, USDC, '1');
  };

  const handleShowTradeBALNForbnUSD = async () => {
    const trade = await calculateTrade(BALN, bnUSD, '1');

    if (!trade) {
      console.log('No trade found');
    }
  };
  const handleSwapBALNForbnUSD = async () => {
    console.log('handleSwapBLANForbnUSD');
    await swap(BALN, bnUSD, '1');
  };

  const handleShowTradeBALNForUSDC = async () => {
    const trade = await calculateTrade(BALN, USDC, '1');

    if (!trade) {
      console.log('No trade found');
    }
  };
  const handleSwapBALNForUSDC = async () => {
    console.log('handleSwapBLANForUSDC');
    await swap(BALN, USDC, '1');
  };

  const handleShowTradeBALNForICX = async () => {
    const trade = await calculateTrade(BALN, ICX, '1');
    if (!trade) {
      console.log('No trade found');
    }
  };

  const handleSwapBALNForICX = async () => {
    console.log('handleSwapBLANForICX');
    await swap(BALN, ICX, '1');
  };

  const handleFetchIconEventLogs = async () => {
    const startBlockHeight = 83073062n;
    const endBlockHeight = 83073112n;
    const iconPublicXService = xServiceActions.getPublicXService('0x1.icon');
    const events = await iconPublicXService.getEventLogs({ startBlockHeight, endBlockHeight });
    console.log(events);
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <AllPublicXServicesCreator xChains={xChains} />
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeICXForbnUSD} disabled={isProcessing}>
          Show Trade for swapping ICX:ICON for bnUSD:ICON
        </Button>
        <Button onClick={handleSwapICXForbnUSD} disabled={isProcessing}>
          Swap ICX:ICON for bnUSD:ICON
        </Button>
      </Flex>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeICXForUSDC} disabled={isProcessing}>
          Show Trade for swapping ICX:ICON for USDC:ICON
        </Button>
        <Button onClick={handleSwapICXForUSDC} disabled={isProcessing}>
          Swap ICX:ICON for USDC:ICON
        </Button>
      </Flex>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeBALNForbnUSD} disabled={isProcessing}>
          Show Trade for swapping BALN:ICON for bnUSD:ICON
        </Button>
        <Button onClick={handleSwapBALNForbnUSD} disabled={isProcessing}>
          Swap BALN:ICON for bnUSD:ICON
        </Button>
      </Flex>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeBALNForUSDC} disabled={isProcessing}>
          Show Trade for swapping BALN:ICON for USDC:ICON
        </Button>
        <Button onClick={handleSwapBALNForUSDC} disabled={isProcessing}>
          Swap BALN:ICON for USDC:ICON
        </Button>
      </Flex>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleShowTradeBALNForICX} disabled={isProcessing}>
          Show Trade for swapping BALN:ICON for ICX:ICON
        </Button>
        <Button onClick={handleSwapBALNForICX} disabled={isProcessing}>
          Swap BALN:ICON for ICX:ICON
        </Button>
      </Flex>
      <Flex>
        <Button onClick={handleFetchIconEventLogs}>get icon event logs from 83073062 to 83073072</Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
