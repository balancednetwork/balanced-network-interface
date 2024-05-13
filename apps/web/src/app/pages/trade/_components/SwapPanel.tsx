import React, { useCallback } from 'react';

import { Price, TradeType, Currency, Percent, Token } from '@balancednetwork/sdk-core';
import { Trade, Route } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { ChevronRight } from 'react-feather';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { CurrentXCallStateType } from 'app/pages/trade/bridge-v2/types';
import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import Popover, { DropdownPopper } from 'app/components/Popover';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Typography } from 'app/theme';
import FlipIcon from 'assets/icons/flip.svg';
import { SLIPPAGE_WARNING_THRESHOLD } from 'constants/misc';
import { useSwapSlippageTolerance, useWalletModalToggle, useSetSlippageTolerance } from 'store/application/hooks';
import { useCAMemo, useIsSwapEligible, useMaxSwapSize } from 'store/stabilityFund/hooks';
import { Field } from 'store/swap/reducer';
import { useDerivedSwapInfo, useInitialSwapLoad, useSwapActionHandlers, useSwapState } from 'store/swap/hooks';
import { useSignedInWallets } from 'store/wallet/hooks';
import { useCurrentXCallState, useSetNotPristine, useSetXCallState } from 'store/xCall/hooks';
import { formatPercent, maxAmountSpend } from 'utils';

import Divider from 'app/components/Divider';
import StabilityFund from 'app/components/StabilityFund';
import { XCallDescription } from 'app/components/XCallDescription';
import { BrightPanel } from 'app/components/trade/utils';
import { isXToken } from 'app/pages/trade/bridge-v2/utils';
import useXCallFee from 'app/pages/trade/bridge-v2/_hooks/useXCallFee';
import useXCallProtocol from 'app/pages/trade/bridge-v2/_hooks/useXCallProtocol';

import XCallSwapModal from './XCallSwapModal';
import { useCreateXCallService } from '../bridge-v2/_zustand/useXCallServiceStore';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import SwapModal from './SwapModal';
import { MODAL_IDS, modalActions } from '../bridge-v2/_zustand/useModalStore';

const MemoizedStabilityFund = React.memo(StabilityFund);

export default function SwapPanel() {
  useInitialSwapLoad();

  const setCurrentXCallState = useSetXCallState();
  const currentXCallState = useCurrentXCallState();
  const setNotPristine = useSetNotPristine();
  const { recipient } = useSwapState();
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

  const signedInWallets = useSignedInWallets();
  const isOutputCrosschainCompatible = isXToken(currencies?.OUTPUT);
  const isInputCrosschainCompatible = isXToken(currencies?.INPUT);

  useCreateXCallService(direction.from);
  useCreateXCallService(direction.to);
  useCreateXCallService(ICON_XCALL_NETWORK_ID);

  const {
    onUserInput,
    onCurrencySelection,
    onSwitchTokens,
    onPercentSelection,
    onChangeRecipient,
    onSwitchChain,
    onChainSelection,
  } = useSwapActionHandlers();

  React.useEffect(() => {
    const destinationWallet = signedInWallets.find(wallet => wallet.chainId === direction.to);
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

  const [showInverted, setShowInverted] = React.useState<boolean>(false);
  const slippageTolerance = useSwapSlippageTolerance();
  const setSlippageTolerance = useSetSlippageTolerance();
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
      if (!account) {
        toggleWalletModal();
      }
      setExecutionTrade(trade);
      // setCurrentXCallState(CurrentXCallStateType.AWAKE);
      modalActions.openModal(MODAL_IDS.XCALL_SWAP_MODAL);
    } else {
      if (!account) {
        toggleWalletModal();
      } else {
        setShowSwapConfirm(true);
        setExecutionTrade(trade);
      }
    }
  }, [account, toggleWalletModal, trade, isXSwap]);

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
    <Button disabled={!!account} color="primary" onClick={handleSwap}>
      {account ? inputError || t`Swap` : t`Swap`}
    </Button>
  );

  const protocol = useXCallProtocol(direction.from, direction.to);
  const { formattedXCallFee } = useXCallFee(direction.from, direction.to);

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
              selectedCurrency={currencies[Field.OUTPUT]}
              isCrossChainToken={isInputCrosschainCompatible}
              xChainId={direction.from}
              onChainSelect={
                isInputCrosschainCompatible ? xChainId => onChainSelection(Field.INPUT, xChainId) : undefined
              }
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
              <Trans>Wallet:</Trans>{' '}
              {`${
                currencyBalances[Field.OUTPUT] ? currencyBalances[Field.OUTPUT]?.toFixed(4, { groupSeparator: ',' }) : 0
              } 
                ${currencies[Field.OUTPUT]?.symbol}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              account={account}
              value={formattedAmounts[Field.OUTPUT]}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              selectedCurrency={currencies[Field.INPUT]}
              isCrossChainToken={isOutputCrosschainCompatible}
              xChainId={direction.to}
              onChainSelect={xChainId => onChainSelection(Field.OUTPUT, xChainId)}
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
                  <Box padding={5} bg="bg4" width={328}>
                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>
                        <Trans>Exchange rate</Trans>
                      </Typography>

                      {trade && (
                        <TradePrice
                          price={trade.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      )}
                    </Flex>

                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>
                        <Trans>Route</Trans>
                      </Typography>

                      <Typography textAlign="right">{trade ? <TradeRoute route={trade.route} /> : '-'}</Typography>
                    </Flex>

                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>
                        <Trans>Fee</Trans>
                      </Typography>

                      <Typography textAlign="right">
                        {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
                      </Typography>
                    </Flex>

                    <Flex alignItems="baseline" justifyContent="space-between">
                      <Typography as="span">
                        <Trans>Slippage tolerance</Trans>
                        <QuestionHelper text={t`If the price slips by more than this amount, your swap will fail.`} />
                      </Typography>
                      <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
                    </Flex>

                    {isXSwap && (
                      <>
                        <Divider my={2} />
                        <Flex alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography>
                            <Trans>Bridge</Trans>
                          </Typography>
                          {protocol && (
                            <Typography color="text">
                              {protocol?.name} + xCall
                              <QuestionWrapper style={{ marginLeft: '3px', transform: 'translateY(1px)' }}>
                                <QuestionHelper width={300} text={<XCallDescription protocol={protocol} />} />
                              </QuestionWrapper>
                            </Typography>
                          )}{' '}
                        </Flex>
                        <Flex alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography>
                            <Trans>Bridge fee</Trans>
                          </Typography>

                          <Typography color="text">{formattedXCallFee ?? ''}</Typography>
                        </Flex>
                        <Flex alignItems="center" justifyContent="space-between" mb={2}>
                          <Typography>
                            <Trans>Transfer time</Trans>
                          </Typography>

                          <Typography textAlign="right">~ 30s</Typography>
                        </Flex>
                      </>
                    )}
                  </Box>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          <Flex justifyContent="center" mt={4}>
            {showFundOption ? (
              <Popover
                content={
                  <MemoizedStabilityFund
                    clearSwapInputOutput={clearSwapInputOutput}
                    setInput={handleTypeInput}
                    inputAmount={memoizedInputAmount}
                    outputAmount={memoizedOutputAmount}
                  />
                }
                show={true}
                placement="bottom"
                fallbackPlacements={isMobile ? [] : ['right-start', 'top']}
                zIndex={10}
                strategy="absolute"
              >
                {swapButton}
              </Popover>
            ) : (
              swapButton
            )}
          </Flex>
        </AutoColumn>
      </BrightPanel>

      <SwapModal
        isOpen={showSwapConfirm}
        onClose={handleSwapConfirmDismiss}
        account={account}
        currencies={currencies}
        executionTrade={executionTrade}
      />

      <XCallSwapModal
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

interface TradePriceProps {
  price: Price<Currency, Currency>;
  showInverted: boolean;
  setShowInverted: (showInverted: boolean) => void;
}

const StyledPriceContainer = styled(Box)`
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  padding: 0;
  border: none;
  cursor: pointer;
`;

function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  let formattedPrice: string;
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `;
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`;
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted]);

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`;

  return (
    <StyledPriceContainer onClick={flipPrice} title={text}>
      <div style={{ alignItems: 'center', display: 'flex', width: 'fit-content' }}>
        <Typography textAlign="right">{text}</Typography>
      </div>
    </StyledPriceContainer>
  );
}

function TradeRoute({ route }: { route: Route<Currency, Currency> }) {
  return (
    <>
      {route.path.map((token: Token, index: number) => (
        <span key={token.address}>
          {index > 0 && <ChevronRight size={14} />} {token.symbol}
        </span>
      ))}
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
