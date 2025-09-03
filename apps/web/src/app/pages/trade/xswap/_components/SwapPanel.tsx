import React, { useCallback, useMemo, useState } from 'react';

import { Currency, Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel } from '@/app/components/Panel';
import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import SolanaAccountExistenceWarning from '@/app/components/SolanaAccountExistenceWarning';
import StellarSponsorshipModal from '@/app/components/StellarSponsorshipModal';
import StellarTrustlineModal from '@/app/components/StellarTrustlineModal';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import useManualAddresses from '@/hooks/useManualAddresses';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import { useOrderStore } from '@/store/order/useOrderStore';
import { useDerivedTradeInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XChainId } from '@balancednetwork/sdk-core';
import { type XToken, getXChainType, useXAccount } from '@balancednetwork/xwagmi';
import OrderCommitButton from './OrderCommitButton';
import OrderInfo from './OrderInfo';
import PriceImpact from './PriceImpact';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    currencyBalances,
    currencies,
    percents,
    sourceAddress,
    direction,
    formattedAmounts,
    stellarValidation,
    stellarTrustlineValidation,
    parsedAmounts,
  } = useDerivedTradeInfo();

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();
  const isRecipientCustom = recipient !== null && !signedInWallets.some(wallet => wallet.address === recipient);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  const handleInputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.INPUT, xChainId);
    },
    [onChainSelection],
  );

  const handleOutputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.OUTPUT, xChainId);
    },
    [onChainSelection],
  );

  const outputAccount = useXAccount(getXChainType(direction.to));

  const { manualAddresses, setManualAddress } = useManualAddresses();

  React.useEffect(() => {
    if (manualAddresses[direction.to]) {
      onChangeRecipient(manualAddresses[direction.to] ?? null);
    } else if (outputAccount.address) {
      onChangeRecipient(outputAccount.address);
    } else {
      onChangeRecipient(null);
    }
  }, [onChangeRecipient, outputAccount.address, manualAddresses[direction.to], direction.to]);

  const handleInputType = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );

  const handleOutputType = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency);
    },
    [onCurrencySelection],
  );

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency);
    },
    [onCurrencySelection],
  );

  const maxInputAmount = useMemo(() => maxAmountSpend(currencyBalances[Field.INPUT]), [currencyBalances]);

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const rates = useRatesWithOracle();

  const swapInputValue = useMemo(() => {
    return formattedAmounts[Field.INPUT];
  }, [formattedAmounts]);

  const swapOutputValue = useMemo(() => {
    return formattedAmounts[Field.OUTPUT];
  }, [formattedAmounts]);

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Swap</Trans>
            </Typography>
            {sourceAddress && currencyBalances[Field.INPUT] && (
              <Typography as="div" hidden={!sourceAddress}>
                <Trans>Wallet:</Trans>{' '}
                {`${formatBalance(
                  currencyBalances[Field.INPUT]?.toFixed(),
                  rates?.[currencyBalances[Field.INPUT]?.currency.symbol]?.toFixed(),
                )} ${currencies[Field.INPUT]?.symbol}`}
              </Typography>
            )}
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={swapInputValue ?? ''}
              currency={currencies[Field.INPUT]}
              onUserInput={handleInputType}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
              xChainId={direction.from}
              onChainSelect={handleInputChainSelection}
              showCrossChainOptions={true}
              currencySelectionType={CurrencySelectionType.SODAX_TRADE_IN}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" my={-1}>
            <FlipButton onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>For</Trans>
            </Typography>
            <Typography as="div" hidden={!recipient}>
              {recipient && (
                <>
                  <Trans>Wallet:</Trans>{' '}
                  {isRecipientCustom ? (
                    <Trans>Custom</Trans>
                  ) : (
                    `${
                      currencyBalances[Field.OUTPUT]
                        ? formatBalance(
                            currencyBalances[Field.OUTPUT]?.toFixed(),
                            rates?.[currencyBalances[Field.OUTPUT]?.currency.symbol]?.toFixed(),
                          )
                        : '0'
                    } ${formatSymbol(currencies[Field.OUTPUT]?.symbol)}`
                  )}
                </>
              )}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={swapOutputValue ?? ''}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleOutputType}
              onCurrencySelect={handleOutputSelect}
              xChainId={direction.to}
              onChainSelect={handleOutputChainSelection}
              showCrossChainOptions={true}
              addressEditable
              setManualAddress={setManualAddress}
              showWarning={false}
              currencySelectionType={CurrencySelectionType.SODAX_TRADE_OUT}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <PriceImpact trade={undefined} />
          <OrderInfo />
          <Flex justifyContent="center" mt={4}>
            <OrderCommitButton
              recipient={recipient}
              stellarValidation={stellarValidation}
              stellarTrustlineValidation={stellarTrustlineValidation}
            />
          </Flex>

          {stellarValidation?.ok === false && stellarValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarSponsorshipModal text={'Activate your Stellar wallet.'} address={recipient} />
            </Flex>
          )}

          {stellarTrustlineValidation?.ok === false && stellarTrustlineValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarTrustlineModal
                currency={currencies[Field.OUTPUT]}
                text={`Activate ${currencies[Field.OUTPUT]?.symbol} for your Stellar wallet.`}
                address={recipient}
              />
            </Flex>
          )}

          <SolanaAccountExistenceWarning
            destinationChainId={direction.to}
            currencyAmount={parsedAmounts[Field.OUTPUT]}
            recipient={recipient ?? ''}
            onActivate={() => {
              handleOutputType('0.002');
            }}
          />
        </AutoColumn>
      </BrightPanel>
    </>
  );
}

export const FlipButton = styled(Box)`
  cursor: pointer;
`;
