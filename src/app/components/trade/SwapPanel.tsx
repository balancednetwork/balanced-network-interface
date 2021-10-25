import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import IRC2 from 'packages/BalancedJs/contracts/IRC2';
import ContractSettings from 'packages/BalancedJs/contractSettings';
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
import { NETWORK_ID } from 'constants/config';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
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
import { Price, TradeType } from 'types/balanced-sdk-core';
import { Currency, Percent, Token } from 'types/balanced-sdk-core/entities';
import { Trade, Route } from 'types/balanced-v1-sdk/entities';
import { formatBigNumber, formatPercent, maxAmountSpend } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import { BrightPanel, swapMessage } from './utils';

export default function SwapPanel() {
  const { account } = useIconReact();
  const { independentField, typedValue } = useSwapState();
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const { trade, currencyBalances, currencies, parsedAmount, inputError, percents } = useDerivedSwapInfo();

  const parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
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
    (inputCurrency: Currency) => onCurrencySelection(Field.INPUT, inputCurrency),
    [onCurrencySelection],
  );

  const handleOutputSelect = React.useCallback(
    (outputCurrency: Currency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection],
  );

  const handleInputPercentSelect = React.useCallback(
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

    if (executionTrade.inputAmount.currency.symbol === 'ICX') {
      bnJs
        .inject({ account })
        .Router.swapICX(BalancedJs.utils.toLoop(executionTrade.inputAmount.toExact()), executionTrade.route.pathForSwap)
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
      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

      const contractSettings = new ContractSettings({ networkId: NETWORK_ID });
      const token = SUPPORTED_TOKENS_LIST.find(token => token.symbol === executionTrade.inputAmount.currency.symbol);
      const tokenContract = new IRC2(contractSettings, token?.address);

      tokenContract
        .swapUsingRoute(
          BalancedJs.utils.toLoop(executionTrade.inputAmount.toExact(), currencies[Field.INPUT]?.symbol!),
          executionTrade.outputAmount.currency.symbol!,
          BalancedJs.utils.toLoop(minReceived.toExact(), currencies[Field.OUTPUT]?.symbol!),
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
              {`${currencyBalances[Field.INPUT]?.toSignificant()} ${currencies[Field.INPUT]?.symbol}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={false}
              currency={currencies[Field.INPUT]}
              onUserInput={handleTypeInput}
              onCurrencySelect={handleInputSelect}
              id="swap-currency-input"
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
              {`${currencyBalances[Field.OUTPUT]?.toSignificant()} ${currencies[Field.OUTPUT]?.symbol}`}
            </Typography>
          </Flex>

          <Flex>
            <CurrencyInputPanel
              value={formattedAmounts[Field.OUTPUT]}
              showMaxButton={false}
              currency={currencies[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              onCurrencySelect={handleOutputSelect}
              id="swap-currency-output"
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
                      : `0 ${currencies[Field.OUTPUT]?.symbol}`
                  }
                  arrowRef={arrowRef}
                />

                <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
                  <Box padding={5} bg="bg4" width={328}>
                    <Flex alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography>Exchange rate</Typography>

                      {trade && (
                        <TradePrice
                          price={trade.executionPrice}
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
                        {trade ? trade.fee.toFixed(4) : '0'} {currencies[Field.INPUT]?.symbol}
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
            Swap {currencies[Field.INPUT]?.symbol} for {currencies[Field.OUTPUT]?.symbol}?
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
                {currencies[Field.INPUT]?.symbol}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">Receive</Typography>
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
            Includes a fee of {formatBigNumber(new BigNumber(executionTrade?.fee.toFixed() || 0), 'currency')}{' '}
            {currencies[Field.INPUT]?.symbol}.
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
