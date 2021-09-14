import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import ClickAwayListener from 'react-click-away-listener';
import { ChevronRight } from 'react-feather';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { DropdownPopper } from 'app/components/Popover';
import QuestionHelper from 'app/components/QuestionHelper';
import SlippageSetting from 'app/components/SlippageSetting';
import { Typography } from 'app/theme';
import { ReactComponent as FlipIcon } from 'assets/icons/flip.svg';
import bnJs from 'bnJs';
import { getPairableCurrencies, CURRENCY } from 'constants/currency';
import {
  useSwapSlippageTolerance,
  useWalletModalToggle,
  useSetSlippageTolerance,
  useChangeShouldLedgerSign,
  useShouldLedgerSign,
} from 'store/application/hooks';
import { Field } from 'store/swap/actions';
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { CurrencyKey, Price } from 'types';
import { convertCurrencyAmount, revertPrice } from 'types/adapter';
import { formatBigNumber, formatPercent, maxAmountSpend } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import { TradeType } from '../../../types/balanced-sdk-core';
import { Currency, Percent, Token } from '../../../types/balanced-sdk-core/entities';
import { Trade, Route } from '../../../types/balanced-v1-sdk/entities';
import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import { BrightPanel, swapMessage } from './utils';

export default function SwapPanel() {
  const { account } = useIconReact();
  const { independentField, typedValue } = useSwapState();
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const { trade, currencyBalances, currencyKeys, parsedAmount, inputError, price, percents } = useDerivedSwapInfo();

  const parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? convertCurrencyAmount(parsedAmount) : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? convertCurrencyAmount(parsedAmount) : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade],
  );

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  };

  const { onUserInput, onCurrencySelection, onSwitchTokens, onPercentSelection } = useSwapActionHandlers();

  const handleTypeInput = React.useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value);
    },
    [onUserInput],
  );
  const handleTypeOutput = React.useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value);
    },
    [onUserInput],
  );

  const maxInputAmount = maxAmountSpend(currencyBalances[Field.INPUT]);

  const handleInputSelect = React.useCallback(
    (inputCurrencyKey: CurrencyKey) => onCurrencySelection(Field.INPUT, inputCurrencyKey),
    [onCurrencySelection],
  );

  const handleOutputSelect = React.useCallback(
    (outputCurrencyKey: CurrencyKey) => onCurrencySelection(Field.OUTPUT, outputCurrencyKey),
    [onCurrencySelection],
  );

  const handleInputPercentSelect = React.useCallback(
    (percent: number) => {
      maxInputAmount && onPercentSelection(Field.INPUT, percent, maxInputAmount.amount.times(percent / 100).toFixed());
    },
    [onPercentSelection, maxInputAmount],
  );

  const pairableCurrencyList = React.useMemo(() => getPairableCurrencies(currencyKeys[Field.INPUT]), [currencyKeys]);

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
  const handleSwap = () => {
    if (!account) {
      toggleWalletModal();
    } else {
      setShowSwapConfirm(true);
      setExecutionTrade(trade);
    }
  };

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

    if (executionTrade.isQueue) {
      //handle queue
      if (executionTrade.inputAmount.currency.symbol === 'sICX') {
        bnJs
          .inject({ account })
          .sICX.swapToICX(BalancedJs.utils.toLoop(new BigNumber(executionTrade.inputAmount.toExact())))
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
        bnJs
          .inject({ account })
          .Staking.stakeICX(account, BalancedJs.utils.toLoop(new BigNumber(executionTrade.inputAmount.toExact())))
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
      }
    } else {
      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
      const tokenContract = bnJs.inject({ account })[executionTrade.inputAmount.currency.symbol || 'IN'];

      tokenContract
        .swap(
          BalancedJs.utils.toLoop(new BigNumber(executionTrade.inputAmount.toExact()), currencyKeys[Field.INPUT]),
          executionTrade.outputAmount.currency.symbol,
          BalancedJs.utils.toLoop(new BigNumber(minReceived.toExact()), currencyKeys[Field.OUTPUT]),
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
    }
  };

  //
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const closeDropdown = () => {
    setAnchor(null);
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <BrightPanel bg="bg3" p={[5, 7]} flexDirection="column" alignItems="stretch" flex={1}>
        <AutoColumn gap="md">
          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">Swap</Typography>
            <Typography as="div" hidden={!account}>
              {'Wallet: '}
              {`${formatBigNumber(currencyBalances[Field.INPUT]?.amount, 'currency')} ${currencyKeys[Field.INPUT]}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={false}
              currency={currencyKeys[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              id="swap-currency-input"
              currencyList={CURRENCY}
              onPercentSelect={!!account ? handleInputPercentSelect : undefined}
              percent={percents[Field.INPUT]}
            />
          </Flex>

          <Flex alignItems="center" justifyContent="center" my={-1}>
            <FlipButton onClick={onSwitchTokens}>
              <FlipIcon width={25} height={17} />
            </FlipButton>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography variant="h2">For</Typography>
            <Typography as="div" hidden={!account}>
              {'Wallet: '}
              {`${formatBigNumber(currencyBalances[Field.OUTPUT]?.amount, 'currency')} ${currencyKeys[Field.OUTPUT]}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              showMaxButton={false}
              currency={currencyKeys[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              id="swap-currency-output"
              currencyList={pairableCurrencyList}
            />
          </Flex>
        </AutoColumn>

        <AutoColumn gap="5px" mt={5}>
          <Flex alignItems="center" justifyContent="space-between">
            <Typography>Price impact</Typography>

            <Typography>{priceImpact}</Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="space-between">
            <Typography>Minimum to receive</Typography>

            <ClickAwayListener onClickAway={closeDropdown}>
              <div>
                <UnderlineTextWithArrow
                  onClick={handleToggleDropdown}
                  text={
                    minimumToReceive
                      ? `${minimumToReceive?.toFixed(4)} ${minimumToReceive?.currency.symbol}`
                      : `0 ${currencyKeys[Field.OUTPUT]}`
                  }
                  arrowRef={arrowRef}
                />

                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                  <Box padding={5} bg="bg4" width={328}>
                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>Exchange rate</Typography>

                      {(trade?.executionPrice || price) && (
                        <TradePrice
                          price={(trade ? revertPrice(trade.executionPrice) : price) as Price}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      )}
                    </Flex>

                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>Route</Typography>

                      <Typography textAlign="right">{trade ? <TradeRoute route={trade.route} /> : '-'}</Typography>
                    </Flex>

                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>Fee</Typography>

                      <Typography textAlign="right">
                        {trade ? trade.fee.toFixed(4) : '0'} {currencyKeys[Field.INPUT]}
                      </Typography>
                    </Flex>

                    <Flex alignItems="baseline" justifyContent="space-between">
                      <Typography as="span">
                        Slippage tolerance
                        <QuestionHelper text="If the price slips by more than this amount, your swap will fail." />
                      </Typography>
                      <SlippageSetting rawSlippage={slippageTolerance} setRawSlippage={setSlippageTolerance} />
                    </Flex>
                  </Box>
                </DropdownPopper>
              </div>
            </ClickAwayListener>
          </Flex>

          <Flex justifyContent="center" mt={4}>
            {isValid ? (
              <Button color="primary" onClick={handleSwap}>
                Swap
              </Button>
            ) : (
              <Button disabled={!!account} color="primary" onClick={handleSwap}>
                {account ? inputError : 'Swap'}
              </Button>
            )}
          </Flex>
        </AutoColumn>
      </BrightPanel>

      <Modal isOpen={showSwapConfirm} onDismiss={handleSwapConfirmDismiss}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Swap {currencyKeys[Field.INPUT]} for {currencyKeys[Field.OUTPUT]}?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {`${formatBigNumber(new BigNumber(executionTrade?.executionPrice.toFixed() || 0), 'ratio')} ${
              executionTrade?.executionPrice.quoteCurrency.symbol
            } 
              per ${executionTrade?.executionPrice.baseCurrency.symbol}`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Pay</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(executionTrade?.inputAmount.toFixed() || 0), 'currency')}{' '}
                {currencyKeys[Field.INPUT]}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
              <Typography variant="p" textAlign="center">
                {formatBigNumber(new BigNumber(executionTrade?.outputAmount.toFixed() || 0), 'currency')}{' '}
                {currencyKeys[Field.OUTPUT]}
              </Typography>
            </Box>
          </Flex>

          <Typography
            textAlign="center"
            hidden={currencyKeys[Field.INPUT] === 'ICX' && currencyKeys[Field.OUTPUT] === 'sICX'}
          >
            Includes a fee of {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
            {currencyKeys[Field.INPUT]}.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={handleSwapConfirmDismiss}>Cancel</TextButton>
                <Button onClick={handleSwapConfirm} disabled={!hasEnoughICX}>
                  Swap
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
}

interface TradePriceProps {
  price: Price;
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
    formattedPrice = showInverted ? price.value.toFormat(4) : price.invert().value.toFormat(4);
  } catch (error) {
    formattedPrice = '0';
  }

  const label = showInverted ? `${price.quoteCurrencyKey}` : `${price.baseCurrencyKey} `;
  const labelInverted = showInverted ? `${price.baseCurrencyKey} ` : `${price.quoteCurrencyKey}`;
  const flipPrice = React.useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted]);

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
