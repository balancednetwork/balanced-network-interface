import React, { useCallback } from 'react';

import { Currency, CurrencyAmount, Percent, TradeType, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import BridgeLimitWarning from '@/app/components/BridgeLimitWarning';
import { Button } from '@/app/components/Button';
import { AutoColumn } from '@/app/components/Column';
import CurrencyInputPanel from '@/app/components/CurrencyInputPanel';
import { BrightPanel } from '@/app/components/Panel';
import { SelectorType } from '@/app/components/SearchModal/CurrencySearch';
import { handleConnectWallet } from '@/app/components/WalletModal/WalletItem';
import { Typography } from '@/app/theme';
import FlipIcon from '@/assets/icons/flip.svg';
import useManualAddresses from '@/hooks/useManualAddresses';
import { MODAL_ID, modalActions } from '@/hooks/useModalStore';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { maxAmountSpend } from '@/utils';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount, useXConnect, useXConnectors } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import PriceImpact from './PriceImpact';
import SwapInfo from './SwapInfo';
import SwapModal from './SwapModal';
import XSwapModal from './XSwapModal';

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
  } = useDerivedSwapInfo();

  const signedInWallets = useSignedInWallets();
  const { recipient } = useSwapState();
  const isRecipientCustom = recipient !== null && !signedInWallets.some(wallet => wallet.address === recipient);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  const handleSwapInputChainSelection = useCallback(
    (xChainId: XChainId) => {
      onChainSelection(Field.INPUT, xChainId);
    },
    [onChainSelection],
  );
  const handleSwapOutputChainSelection = useCallback(
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
  }, [onChangeRecipient, outputAccount, manualAddresses[direction.to], direction.to]);

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );

  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const clearSwapInputOutput = useCallback((): void => {
    handleTypeInput('');
    handleTypeOutput('');
  }, [handleTypeInput, handleTypeOutput]);

  const maxInputAmount = React.useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT], direction.from),
    [currencyBalances, direction.from],
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

  const handleInputPercentSelect = useCallback(
    (percent: number) => {
      maxInputAmount &&
        onPercentSelection(Field.INPUT, percent, maxInputAmount.multiply(new Percent(percent, 100)).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const isValid = !inputError && canBridge;

  const xChainType = getXChainType(direction.from);
  const xConnectors = useXConnectors(xChainType);
  const xConnect = useXConnect();

  // handle swap modal
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = React.useCallback(
    (clearInputs = true) => {
      setShowSwapConfirm(false);
      clearInputs && clearSwapInputOutput();
    },
    [clearSwapInputOutput],
  );

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = React.useState<Trade<Currency, Currency, TradeType>>();

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const handleSwap = useCallback(() => {
    if (isXSwap) {
      if ((!account && recipient) || (!account && direction.from === direction.to)) {
        handleConnectWallet(xChainType, xConnectors, xConnect);
      } else if (!account && !recipient) {
        toggleWalletModal();
      } else {
        setExecutionTrade(trade);
        modalActions.openModal(MODAL_ID.XSWAP_CONFIRM_MODAL);
      }
    } else {
      if (!account) {
        toggleWalletModal();
      } else {
        setShowSwapConfirm(true);
        setExecutionTrade(trade);
      }
    }
  }, [
    account,
    toggleWalletModal,
    trade,
    isXSwap,
    recipient,
    direction.from,
    direction.to,
    xChainType,
    xConnectors,
    xConnect,
  ]);

  const handleMaximumBridgeAmountClick = (amount: CurrencyAmount<XToken>) => {
    onUserInput(Field.OUTPUT, amount?.toFixed(4));
  };

  const swapButton = isValid ? (
    <Button color="primary" onClick={handleSwap}>
      <Trans>Swap</Trans>
    </Button>
  ) : (
    <Button disabled={!account || !!inputError || !canBridge} color="primary" onClick={handleSwap}>
      {inputError || t`Swap`}
    </Button>
  );

  return (
    <>
      <BrightPanel bg="bg3" p={[3, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">
              <Trans>Swap</Trans>
            </Typography>
            <Typography as="div" hidden={!account}>
              <Trans>Wallet:</Trans>{' '}
              {`${
                currencyBalances[Field.INPUT] ? currencyBalances[Field.INPUT]?.toFixed(4, { groupSeparator: ',' }) : 0
              } 
                ${currencies[Field.INPUT]?.symbol}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={formattedAmounts[Field.INPUT]}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              onPercentSelect={signedInWallets.length > 0 ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
              xChainId={direction.from}
              onChainSelect={handleSwapInputChainSelection}
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
                        ? currencyBalances[Field.OUTPUT]?.toFixed(4, { groupSeparator: ',' })
                        : 0
                    } 
                ${currencies[Field.OUTPUT]?.symbol}`
                  )}
                </>
              )}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={formattedAmounts[Field.OUTPUT]}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              xChainId={direction.to}
              onChainSelect={handleSwapOutputChainSelection}
              showCrossChainOptions={true}
              addressEditable
              selectorType={SelectorType.SWAP_OUT}
              setManualAddress={setManualAddress}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <PriceImpact trade={trade} />

          <SwapInfo trade={trade} />

          <Flex justifyContent="center" mt={4}>
            {swapButton}
          </Flex>

          {!canBridge && maximumBridgeAmount && (
            <BridgeLimitWarning limitAmount={maximumBridgeAmount} onLimitAmountClick={handleMaximumBridgeAmountClick} />
          )}
        </AutoColumn>
      </BrightPanel>

      <SwapModal
        isOpen={showSwapConfirm}
        onClose={handleSwapConfirmDismiss}
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        recipient={recipient || undefined}
      />

      <XSwapModal
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
        direction={direction}
        recipient={recipient}
        clearInputs={clearSwapInputOutput}
      />
    </>
  );
}

const FlipButton = styled(Box)`
  cursor: pointer;
`;
