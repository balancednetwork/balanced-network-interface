import React, { useCallback, useMemo } from 'react';

import { Currency, CurrencyAmount, Percent } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import BridgeLimitWarning from '@/app/components/BridgeLimitWarning';
import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel } from '@/app/components/Panel';
import { SelectorType } from '@/app/components/SearchModal/CurrencySearch';
import SolanaAccountExistenceWarning from '@/app/components/SolanaAccountExistenceWarning';
import StellarSponsorshipModal from '@/app/components/StellarSponsorshipModal';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import { PRICE_IMPACT_WARNING_THRESHOLD } from '@/constants/misc';
import useManualAddresses from '@/hooks/useManualAddresses';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useRatesWithOracle } from '@/queries/reward';
import {
  useDerivedMMTradeInfo,
  useDerivedSwapInfo,
  useInitialSwapLoad,
  useSwapActionHandlers,
  useSwapState,
} from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { formatBalance, formatSymbol } from '@/utils/formatter';
import { XToken, getXChainType } from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import MMPendingIntents from './MMPendingIntents';
import MMSwapCommitButton from './MMSwapCommitButton';
import MMSwapInfo from './MMSwapInfo';
import PriceImpact from './PriceImpact';
import SwapCommitButton from './SwapCommitButton';
import SwapInfo from './SwapInfo';

export default function SwapPanel() {
  useInitialSwapLoad();

  const {
    trade,
    currencyBalances,
    currencies,
    inputError,
    percents,
    account,
    direction,
    formattedAmounts,
    maximumBridgeAmount,
    canBridge,
    stellarValidation,
    parsedAmounts,
  } = useDerivedSwapInfo();
  const mmTrade = useDerivedMMTradeInfo(trade);

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

  const maxInputAmount = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT], direction.from),
    [currencyBalances, direction.from],
  );

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const handleMaxBridgeAmountClick = (amount: CurrencyAmount<XToken>) => {
    onUserInput(Field.OUTPUT, amount?.toFixed(4));
  };

  const rates = useRatesWithOracle();

  const showWarning = trade?.priceImpact.greaterThan(PRICE_IMPACT_WARNING_THRESHOLD);

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Swap</Trans>
            </Typography>
            {account && currencyBalances[Field.INPUT] && (
              <Typography as="div" hidden={!account}>
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
              account={account}
              value={formattedAmounts[Field.INPUT]}
              currency={currencies[Field.INPUT]}
              onUserInput={handleInputType}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
              xChainId={direction.from}
              onChainSelect={handleInputChainSelection}
              showCrossChainOptions={true}
              selectorType={SelectorType.SWAP_IN}
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
              account={account}
              value={
                mmTrade.isMMBetter ? mmTrade.trade?.outputAmount.toSignificant() ?? '' : formattedAmounts[Field.OUTPUT]
              }
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleOutputType}
              onCurrencySelect={handleOutputSelect}
              xChainId={direction.to}
              onChainSelect={handleOutputChainSelection}
              showCrossChainOptions={true}
              addressEditable
              selectorType={SelectorType.SWAP_OUT}
              setManualAddress={setManualAddress}
              showWarning={mmTrade.isMMBetter ? false : showWarning}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <PriceImpact trade={mmTrade?.isMMBetter ? undefined : trade} />

          {mmTrade.isMMBetter ? <MMSwapInfo trade={mmTrade.trade} /> : <SwapInfo trade={trade} />}

          <Flex justifyContent="center" mt={4}>
            <MMSwapCommitButton
              hidden={!mmTrade.isMMBetter}
              currencies={currencies}
              account={account}
              recipient={recipient}
              trade={mmTrade.trade}
              direction={direction}
              stellarValidation={stellarValidation}
            />
            <SwapCommitButton
              hidden={!!mmTrade.isMMBetter}
              trade={trade}
              error={inputError}
              currencies={currencies}
              canBridge={canBridge}
              account={account}
              recipient={recipient}
              direction={direction}
              stellarValidation={stellarValidation}
            />
          </Flex>

          {stellarValidation?.ok === false && stellarValidation.error && recipient && (
            <Flex alignItems="center" justifyContent="center" mt={2} flexDirection="column">
              <StellarSponsorshipModal text={'Activate your Stellar wallet.'} address={recipient} />
            </Flex>
          )}

          {!canBridge && maximumBridgeAmount && trade && (
            <BridgeLimitWarning limitAmount={maximumBridgeAmount} onLimitAmountClick={handleMaxBridgeAmountClick} />
          )}

          <SolanaAccountExistenceWarning
            destinationChainId={direction.to}
            currencyAmount={parsedAmounts[Field.OUTPUT]}
            recipient={recipient ?? ''}
            onActivate={() => {
              handleOutputType('0.002');
            }}
          />

          <MMPendingIntents />
        </AutoColumn>
      </BrightPanel>
    </>
  );
}

const FlipButton = styled(Box)`
  cursor: pointer;
`;
