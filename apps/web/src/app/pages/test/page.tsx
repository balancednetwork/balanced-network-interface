import { Button } from '@/app/components/Button';
import { tryParseAmount } from '@/store/swap/hooks';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  XTransactionInput,
  XTransactionType,
  bnJs,
  getXCallFee,
  useSendXTransaction,
  useXAccount,
  xTokenMapBySymbol,
} from '@balancednetwork/xwagmi';
import React from 'react';
import { Flex } from 'rebass/styled-components';

const bnUSD = xTokenMapBySymbol['0xa4b1.arbitrum']['bnUSD'];

export function TestPage() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const iconAccount = useXAccount('ICON');
  const evmAccount = useXAccount('EVM');

  const sendXTransaction = useSendXTransaction();

  const getLockedAmount = async userNetworkAddress => {
    const lockedAmount = await bnJs.Savings.getLockedAmount(userNetworkAddress);
    console.log('lockedAmount', Number(lockedAmount));
    return lockedAmount;
  };

  const deposit = async (currency: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      await getLockedAmount(`0xa4b1.arbitrum/${evmAccount.address}`);
      // const currencyAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currency);
      // const direction = {
      //   from: '0xa4b1.arbitrum',
      //   to: '0x1.icon',
      // };
      // const input: XTransactionInput = {
      //   direction,
      //   type: XTransactionType.LOCK_STABLE_TOKEN,
      //   account: evmAccount.address,
      //   inputAmount: currencyAmount,
      //   xCallFee: await getXCallFee(direction.from, direction.to),
      // };

      // console.log('input', input);

      // const txHash = await sendXTransaction(input);
      // console.log('txHash', txHash);
    } catch (error) {
      console.error('error', error);
    }
    setIsProcessing(false);
  };
  const handleDeposit = async () => {
    console.log('handleBridgeSUIFromSuiToIcon');
    deposit(bnUSD, '0.12');
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleDeposit} disabled={isProcessing}>
          deposit bnUSD on Arbitrum
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
