import React, { useCallback } from 'react';

import { TradeType, Currency, Percent } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import Popover, { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/flip.svg';
import { SLIPPAGE_WARNING_THRESHOLD } from 'constants/misc';
import { useSwapSlippageTolerance, useWalletModalToggle } from 'store/application/hooks';
import { useCAMemo, useIsSwapEligible, useMaxSwapSize } from 'store/stabilityFund/hooks';
import { Field } from 'store/swap/reducer';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from 'store/swap/hooks';
import { formatPercent, maxAmountSpend } from 'utils';

import StabilityFund from 'app/components/StabilityFund';
import { BrightPanel } from 'app/pages/trade/supply/_components/utils';
import { isXToken } from 'app/pages/trade/bridge/utils';

import XSwapModal from './XSwapModal';
import SwapModal from './SwapModal';
import { MODAL_ID, modalActions } from '../../bridge/_zustand/useModalStore';
import AdvancedSwapDetails from './AdvancedSwapDetails';
import { useAvailableWallets } from '../../bridge/_hooks/useWallets';
import { xChainMap } from '../../bridge/_config/xChains';

const MemoizedStabilityFund = React.memo(StabilityFund);

export default function SwapPanel() {
  useInitialSwapLoad();

  const { trade, currencyBalances, currencies, inputError, percents, account, direction, formattedAmounts } =
    useDerivedSwapInfo();
  const memoizedInputAmount = useCAMemo(trade?.inputAmount);
  const memoizedOutputAmount = useCAMemo(trade?.outputAmount);
  const isSwapEligibleForStabilityFund = useIsSwapEligible(
    currencies.INPUT?.wrapped.address,
    currencies.OUTPUT?.wrapped.address,
  );
  const fundMaxSwap = useMaxSwapSize(memoizedInputAmount, memoizedOutputAmount);
  const showSlippageWarning = trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);
  const showFundOption =
    isSwapEligibleForStabilityFund &&
    fundMaxSwap?.greaterThan(0) &&
    direction.from === '0x1.icon' &&
    direction.to === '0x1.icon';

  const signedInWallets = useAvailableWallets();
  const { recipient } = useSwapState();
  const isRecipientCustom = recipient !== null && !signedInWallets.some(wallet => wallet.address === recipient);
  const isOutputCrosschainCompatible = isXToken(currencies?.OUTPUT);
  const isInputCrosschainCompatible = isXToken(currencies?.INPUT);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection, onChangeRecipient, onChainSelection } =
    useSwapActionHandlers();

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(
      wallet => xChainMap[wallet.xChainId].xWalletType === xChainMap[direction.to].xWalletType,
    );
    if (destinationWallet) {
      onChangeRecipient(destinationWallet.address);
    } else {
      onChangeRecipient(null);
    }
  }, [direction, onChangeRecipient, signedInWallets]);

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

  const maxInputAmount = React.useMemo(() => maxAmountSpend(currencyBalances[Field.INPUT]), [currencyBalances]);

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

  const slippageTolerance = useSwapSlippageTolerance();
  const isValid = !inputError;

  // handle swap modal
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const handleSwapConfirmDismiss = () => {
    setShowSwapConfirm(false);
    clearSwapInputOutput();
  };

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = React.useState<Trade<Currency, Currency, TradeType>>();

  const isXSwap = !(direction.from === '0x1.icon' && direction.to === '0x1.icon');

  const handleSwap = useCallback(() => {
    if (isXSwap) {
      if (!account || !recipient) {
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
  }, [account, toggleWalletModal, trade, isXSwap, recipient]);

  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  const swapButton = isValid ? (
    <Button color="primary" onClick={handleSwap}>
      <Trans>Swap</Trans>
    </Button>
  ) : (
    <Button disabled={!account || !!inputError} color="primary" onClick={handleSwap}>
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
              onChainSelect={
                isInputCrosschainCompatible ? xChainId => onChainSelection(Field.INPUT, xChainId) : undefined
              }
              showCrossChainOptions={true}
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
            <Typography as="div" hidden={!account}>
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
              onChainSelect={
                isOutputCrosschainCompatible ? xChainId => onChainSelection(Field.OUTPUT, xChainId) : undefined
              }
              showCrossChainOptions={true}
              addressEditable
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Price impact</Trans>
            </Typography>

            <Typography
              className={showSlippageWarning ? 'error-anim' : ''}
              color={showSlippageWarning ? 'alert' : 'text'}
            >
              {priceImpact}
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>
              <Trans>Minimum to receive</Trans>
            </Typography>

            <ClickAwayListener onClickAway={closeDropdown}>
              <div>
                <UnderlineTextWithArrow
                  onClick={handleToggleDropdown}
                  text={
                    minimumToReceive
                      ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                      : `0 ${currencies[Field.OUTPUT]?.symbol}`
                  }
                  arrowRef={arrowRef}
                />

                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                  <AdvancedSwapDetails />
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          <Flex justifyContent="center" mt={4}>
            {swapButton}
          </Flex>
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

export const AutoColumn = styled(Box)<{
  gap?: 'sm' | 'md' | 'lg' | string;
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between';
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => (gap === 'sm' && '10px') || (gap === 'md' && '15px') || (gap === 'lg' && '25px') || gap};
  justify-items: ${({ justify }) => justify && justify};
`;
