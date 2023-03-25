import React, { useCallback } from 'react';

import { Price, TradeType, Currency, Percent, Token } from '@balancednetwork/sdk-core';
import { Trade, Route } from '@balancednetwork/v1-sdk';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { isMobile } from 'react-device-detect';
import { ChevronRight } from 'react-feather';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import Popover, { DropdownPopper } from 'app/components/Popover';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Typography } from 'app/theme';
import { ReactComponent as FlipIcon } from 'assets/icons/flip.svg';
import bnJs from 'bnJs';
import { SLIPPAGE_WARNING_THRESHOLD } from 'constants/misc';
import {
  useSwapSlippageTolerance,
  useWalletModalToggle,
  useSetSlippageTolerance,
  useChangeShouldLedgerSign,
  useShouldLedgerSign,
} from 'store/application/hooks';
import { useCAMemo, useIsSwapEligible, useMaxSwapSize } from 'store/stabilityFund/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { formatBigNumber, formatPercent, maxAmountSpend, toDec } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import Spinner from '../Spinner';
import StabilityFund from '../StabilityFund';
import { BrightPanel, swapMessage } from './utils';

const MemoizedStabilityFund = React.memo(StabilityFund);

export default function SwapPanel() {
  const { account } = useIconReact();
  const { independentField, typedValue } = useSwapState();
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;
  const { trade, currencyBalances, currencies, parsedAmount, inputError, percents } = useDerivedSwapInfo();
  const memoizedInputAmount = useCAMemo(trade?.inputAmount);
  const memoizedOutputAmount = useCAMemo(trade?.outputAmount);
  const isSwapEligibleForStabilityFund = useIsSwapEligible(
    currencies.INPUT?.wrapped.address,
    currencies.OUTPUT?.wrapped.address,
  );
  const fundMaxSwap = useMaxSwapSize(memoizedInputAmount, memoizedOutputAmount);
  const showFundOption = isSwapEligibleForStabilityFund && fundMaxSwap?.greaterThan(0);
  const showSlippageWarning = trade?.priceImpact.greaterThan(SLIPPAGE_WARNING_THRESHOLD);

  const parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade],
  );

  const formattedAmounts = React.useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    };
  }, [dependentField, independentField, parsedAmounts, typedValue]);

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection } = useSwapActionHandlers();

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

  const handleInputSelect = useCallback((inputCurrency: Currency) => onCurrencySelection(Field.INPUT, inputCurrency), [
    onCurrencySelection,
  ]);

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
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

  // old code
  const [showSwapConfirm, setShowSwapConfirm] = React.useState(false);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleSwapConfirmDismiss = () => {
    if (shouldLedgerSign) return;

    setShowSwapConfirm(false);
    changeShouldLedgerSign(false);
  };

  const toggleWalletModal = useWalletModalToggle();

  const [executionTrade, setExecutionTrade] = React.useState<Trade<Currency, Currency, TradeType>>();
  const handleSwap = useCallback(() => {
    if (!account) {
      toggleWalletModal();
    } else {
      setShowSwapConfirm(true);
      setExecutionTrade(trade);
    }
  }, [account, toggleWalletModal, trade]);

  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));
  const priceImpact = formatPercent(new BigNumber(trade?.priceImpact.toFixed() || 0));
  const addTransaction = useTransactionAdder();

  const handleSwapConfirm = async () => {
    if (!executionTrade || !account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const message = swapMessage(
      executionTrade.inputAmount.toFixed(2),
      executionTrade.inputAmount.currency.symbol || 'IN',
      executionTrade.outputAmount.toFixed(2),
      executionTrade.outputAmount.currency.symbol || 'OUT',
    );

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      bnJs
        .inject({ account })
        .Router.swapICX(toDec(executionTrade.inputAmount), executionTrade.route.pathForSwap, toDec(minReceived))
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: message.pendingMessage,
              summary: message.successMessage,
            },
          );
          handleTypeInput('');
          handleTypeOutput('');
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
        });
    } else {
      const token = executionTrade.inputAmount.currency as Token;
      const outputToken = executionTrade.outputAmount.currency as Token;

      bnJs
        .inject({ account })
        .getContract(token.address)
        .swapUsingRoute(
          toDec(executionTrade.inputAmount),
          outputToken.address,
          toDec(minReceived),
          executionTrade.route.pathForSwap,
        )
        .then((res: any) => {
          setShowSwapConfirm(false);
          addTransaction(
            { hash: res.result },
            {
              pending: message.pendingMessage,
              summary: message.successMessage,
            },
          );
          clearSwapInputOutput();
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
        });
    }
  };

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  const hasEnoughICX = useHasEnoughICX();

  const swapButton = isValid ? (
    <Button color="primary" onClick={handleSwap}>
      <Trans>Swap</Trans>
    </Button>
  ) : (
    <Button disabled={!!account} color="primary" onClick={handleSwap}>
      {account ? inputError : t`Swap`}
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
              {`${currencyBalances[Field.INPUT]?.toFixed(4, { groupSeparator: ',' })} 
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
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
              selectedCurrency={currencies[Field.OUTPUT]}
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
              {`${currencyBalances[Field.OUTPUT]?.toFixed(4, { groupSeparator: ',' })}
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

      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <ModalContent>
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            <Trans>
              Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
            </Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            <Trans>
              {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
                executionTrade?.executionPrice.quoteCurrency.symbol
              } 
              per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
            </Trans>
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Pay</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
                {currencies[Field.INPUT]?.symbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>Receive</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
                {currencies[Field.OUTPUT]?.symbol}
              </Typography>
            </Box>
          </Flex>

          <Typography
            textAlign="center"
            hidden={currencies[Field.INPUT]?.symbol === 'ICX' && currencies[Field.OUTPUT]?.symbol === 'sICX'}
          >
            <Trans>
              Includes a fee of {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
              {currencies[Field.INPUT]?.symbol}.
            </Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleSwapConfirmDismiss}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleSwapConfirm} disabled={!hasEnoughICX}>
                  <Trans>Swap</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
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

const AutoColumn = styled(Box)<{
  gap?: 'sm' | 'md' | 'lg' | string;
  justify?: 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'space-between';
}>`
  display: grid;
  grid-auto-rows: auto;
  grid-row-gap: ${({ gap }) => (gap === 'sm' && '10px') || (gap === 'md' && '15px') || (gap === 'lg' && '25px') || gap};
  justify-items: ${({ justify }) => justify && justify};
`;
