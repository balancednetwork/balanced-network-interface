import { Button } from '@/app/components/Button';
import { tryParseAmount } from '@/store/swap/hooks';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { useXAccount } from '@balancednetwork/xwagmi';
import React from 'react';
import { Flex } from 'rebass/styled-components';

export function TestPage() {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const iconAccount = useXAccount('ICON');
  const suiAccount = useXAccount('SUI');

  const getAllBalances = async () => {
    try {
    } catch (error) {}
  };

  const bridge = async (currency: Currency, currencyInValue: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      const currencyAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(currencyInValue, currency);

      if (!currencyAmount) {
        throw new Error('Invalid amount');
      }

      console.log('currencyAmount', currencyAmount);
    } catch (error) {
      console.error('error', error);
    }
    setIsProcessing(false);
  };
  const handleBridgeSUIFromSuiToIcon = async () => {
    console.log('handleBridgeSUIFromSuiToIcon');
    // await bridge(SUI, '1');
    // await getFee();
    await getAllBalances();
  };

  return (
    <Flex bg="bg3" flex={1} p={2} style={{ gap: 2 }} flexDirection={'column'}>
      <Flex flexDirection={'row'} style={{ gap: 2 }}>
        <Button onClick={handleBridgeSUIFromSuiToIcon} disabled={isProcessing}>
          Bridge SUI from Icon to SUI
        </Button>
      </Flex>
      <Flex>{/* Result here */}</Flex>
    </Flex>
  );
}
