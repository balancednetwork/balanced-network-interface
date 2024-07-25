import React from 'react';
import { Flex, Box } from 'rebass/styled-components';

import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@balancednetwork/sdk-core';
import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { Pair, Trade } from '@balancednetwork/v1-sdk';
import bnJs from 'bnJs';
import BigNumber from 'bignumber.js';
import { havahJs } from 'bnJs';

import { Button } from 'app/components/Button';
import { useIconReact } from 'packages/icon-react';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';
import { useFetchRewardsInfo } from 'store/reward/hooks';
import { TransactionStatus } from '../trade/bridge/_zustand/types';
import { openToast } from 'btp/src/connectors/transactionToast';
import { NULL_CONTRACT_ADDRESS } from 'constants/tokens';
import { AllPublicXServicesCreator, xServiceActions } from '../trade/bridge/_zustand/useXServiceStore';
import { xChains } from '../trade/bridge/_config/xChains';
import { useHavahContext } from 'packages/havah/HavahProvider';
import { tryParseAmount } from 'store/swap/hooks';

const ICX = new Token(ChainId.MAINNET, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
const bnUSD = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD', 'Balanced Dollar');
const BALN = new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].baln, 18, 'BALN', 'Balance Token');
const HVH = new Token(ChainId.MAINNET, 'cxe2da9f10bc6e2754347bde2ef73379bd398fd9f3', 18, 'HVH', 'Havah Token');
const USDC = new Token(ChainId.MAINNET, 'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f', 6, 'USDC', 'Archway USDC');

export function TestPage() {
  const { account } = useIconReact();
  const { address: accountHavah } = useHavahContext();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const bridge = async (currency: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    if (!accountHavah) {
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
      const txResult = await havahJs
        .inject({ account: accountHavah })
        .AssetManager['deposit'](parseFloat(currencyInValue), destination, '', xCallFee.rollback.toString());

      // console.log('txResult', txResult);
    } catch (e) {
      console.error('error', e);
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////
    setIsProcessing(false);
  };

  const handleBridgeHvhFromHavahToIcon = async () => {
    console.log('handleBridgeHvhFromHavahToIcon');
    await bridge(HVH, '1');
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <AllPublicXServicesCreator xChains={xChains} />
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleBridgeHvhFromHavahToIcon} disabled={isProcessing}>
          Bridge HVH from Havah to ICON
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
