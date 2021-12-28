import React, { useEffect, useMemo } from 'react';

import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import CurrencyLogo from 'app/components/CurrencyLogo';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { ReactComponent as ArrowDownIcon } from 'assets/icons/arrow-line.svg';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { ZERO } from 'constants/index';
import { BIGINT_ZERO, FRACTION_ONE, FRACTION_ZERO } from 'constants/misc';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useBalance, usePool, usePoolData, useAvailableBalances, pairToken } from 'store/pool/hooks';
import { useChangeWithdrawnValue, useStakedLPPercent, useWithdrawnPercent } from 'store/stakedLP/hooks';
import { tryParseAmount } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useCurrencyBalances, useHasEnoughICX } from 'store/wallet/hooks';
import { getTokenFromCurrencyKey } from 'types/adapter';
import { Currency, CurrencyAmount, Fraction, Percent } from 'types/balanced-sdk-core';
import { multiplyCABN, toHex } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import StakeLPPanel from './StakeLPPanel';
import { withdrawMessage } from './utils';

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');
  const balances = useAvailableBalances();

  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  const isHidden =
    !balance1 ||
    (JSBI.equal(balance1.balance.quotient, BIGINT_ZERO) &&
      (!balance1.balance1 || JSBI.equal(balance1.balance1.quotient, BIGINT_ZERO)));

  if (isHidden && Object.keys(balances).length === 0) return null;

  return (
    <BoxPanel bg="bg2" mb={10}>
      <Typography variant="h2" mb={5}>
        Liquidity details
      </Typography>

      <TableWrapper>
        <DashGrid>
          <HeaderText>Pool</HeaderText>
          <HeaderText>Your supply</HeaderText>
          {upSmall && <HeaderText>Pool share</HeaderText>}
          {upSmall && <HeaderText>Daily rewards</HeaderText>}
          <HeaderText></HeaderText>
        </DashGrid>
        <Accordion collapsible>
          {!isHidden && (
            <StyledAccordionItem key={BalancedJs.utils.POOL_IDS.sICXICX} border={Object.keys(balances).length !== 0}>
              <StyledAccordionButton>
                <PoolRecord1 />
              </StyledAccordionButton>
              <StyledAccordionPanel hidden={false}>
                <BoxPanel bg="bg3" marginBottom="20px">
                  <Withdraw1 />
                </BoxPanel>
              </StyledAccordionPanel>
            </StyledAccordionItem>
          )}

          {Object.keys(balances).map((poolId, index, arr) => (
            <StyledAccordionItem key={poolId} border={index !== arr.length - 1}>
              <StyledAccordionButton>
                <PoolRecord poolId={+poolId} />
              </StyledAccordionButton>
              <StyledAccordionPanel hidden={false}>
                <StyledBoxPanel bg="bg3">
                  <StakeLPPanel poolId={+poolId} />
                  <Withdraw poolId={+poolId} />
                </StyledBoxPanel>
              </StyledAccordionPanel>
            </StyledAccordionItem>
          ))}
        </Accordion>
      </TableWrapper>
    </BoxPanel>
  );
}

const TableWrapper = styled.div``;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 5fr;
  gap: 10px;
  grid-template-areas: 'name supply action';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }

  ${({ theme }) => theme.mediaWidth.upSmall`
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-areas: 'name supply share rewards action';
  `}
`;

const HeaderText = styled(Typography)`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 3px;
`;

const DataText = styled(Box)`
  font-size: 16px;
`;
const StyledArrowDownIcon = styled(ArrowDownIcon)`
  width: 10px;
  margin-left: 10px;
  margin-top: 10px;
  transition: transform 0.3s ease;
`;
const StyledDataText = styled(Flex)``;

const StyledBoxPanel = styled(BoxPanel)`
  display: flex;
  margin-bottom: 20px;
  flex-direction: column;
  ${({ theme }) => theme.mediaWidth.upSmall`
     flex-direction: row;
  `}
`;

const StyledAccordionItem = styled(AccordionItem)<{ border?: boolean }>`
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
  transition: border-bottom ease-in-out 50ms 480ms;
`;
const ListItem = styled(DashGrid)`
  padding: 20px 0;
  color: #ffffff;
`;

const OptionButton = styled(Box)`
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.bg4};
  border: 2px solid #144a68;
  transition: border 0.3s ease;
  padding: 10px;

  &[disabled] {
    background: rgba(255, 255, 255, 0.15);
    cursor: default;
    pointer-events: none;
  }

  :hover {
    border: 2px solid ${({ theme }) => theme.colors.primary};
    transition: border 0.2s ease;
  }

  > svg,
  img {
    margin-bottom: 10px;
  }
`;

const StyledAccordionButton = styled(AccordionButton)`
  background-color: transparent;
  width: 100%;
  border: none;
  position: relative;

  &:before {
    content: '';
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid #144a68;
    position: absolute;
    transition: all ease-in-out 200ms;
    transform: translate3d(0, 20px, 0);
    opacity: 0;
    pointer-events: none;
    bottom: 0;
    left: 30px;
  }
  &:hover {
    & > ${ListItem} {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        path {
          stroke: ${({ theme }) => theme.colors.primary} !important;
        }
      }
    }
  }
  &[aria-expanded='true'] {
    &:before {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
    & > ${ListItem} {
      p,
      & > div {
        color: ${({ theme }) => theme.colors.primary};
        & > svg {
          transform: rotateX(180deg);

          path {
            stroke: ${({ theme }) => theme.colors.primary} !important;
          }
        }
      }
    }
  }
`;

const StyledAccordionPanel = styled(AccordionPanel)`
  overflow: hidden;
  max-height: 0;
  transition: all ease-in-out 0.5s;
  &[data-state='open'] {
    max-height: 100%;
    ${({ theme }) => theme.mediaWidth.upSmall`
      max-height: 400px;
    `}
  }
`;
const PoolRecord = ({ poolId }: { poolId: number }) => {
  const poolData = usePoolData(poolId);
  const pool = usePool(poolId);
  const upSmall = useMedia('(min-width: 800px)');
  const stakedLPPercent = useStakedLPPercent(poolId);

  const { percent, baseValue, quoteValue } = useWithdrawnPercent(poolId) || {};
  const availableWithdrawnPercent = new BigNumber(100).minus(percent || ZERO);

  const [availableWithdrawnPercentNumerator, availableWithdrawnPercentDenominator] = availableWithdrawnPercent
    ? availableWithdrawnPercent.toFraction()
    : [0, 1];
  // it's a fraction, yet represents BALN amount
  const availableWithdrawnPercentFraction = new Fraction(
    availableWithdrawnPercentNumerator.toFixed(),
    availableWithdrawnPercentDenominator.toFixed(),
  );

  const totalSupply = (stakedValue, suppliedValue) =>
    (!!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue)?.toFixed(2, { groupSeparator: ',' }) ||
    '...';

  const baseCurrencyTotalSupply = totalSupply(baseValue, poolData?.suppliedBase);
  const quoteCurrencyTotalSupply = totalSupply(quoteValue, poolData?.suppliedQuote);

  const [stakedNumerator, stakedDenominator] = stakedLPPercent ? stakedLPPercent.toFraction() : [0, 1];
  const stakedFraction = new Fraction(stakedNumerator.toFixed(), stakedDenominator.toFixed());

  return (
    <ListItem>
      <StyledDataText>
        <DataText>{`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>
      <DataText>
        {`${baseCurrencyTotalSupply} ${pool?.baseToken.symbol || '...'}`}
        <br />
        {`${quoteCurrencyTotalSupply} ${pool?.quoteToken.symbol || '...'}`}
      </DataText>
      {upSmall && (
        <DataText>
          {upSmall && (
            <DataText>{`${
              ((baseValue?.equalTo(0) || quoteValue?.equalTo(0)) && percent?.isGreaterThan(ZERO)
                ? poolData?.poolShare.multiply(100)
                : poolData?.poolShare.multiply(100).multiply(availableWithdrawnPercentFraction)
              )?.toFixed(2, { groupSeparator: ',' }) || '...'
            }%`}</DataText>
          )}
        </DataText>
      )}
      {upSmall && (
        <DataText>
          {poolData?.suppliedReward?.equalTo(FRACTION_ZERO)
            ? stakedLPPercent.isGreaterThanOrEqualTo(new BigNumber(100))
              ? `~ ${
                  poolData?.stakedLPBalance
                    ?.divide(poolData?.suppliedLP || BIGINT_ZERO)
                    .multiply(poolData?.totalReward || BIGINT_ZERO)
                    .toFixed(2, { groupSeparator: ',' }) || '...'
                } BALN`
              : 'ー'
            : `~ ${
                poolData?.suppliedReward?.multiply(stakedFraction).divide(100).toFixed(2, { groupSeparator: ',' }) ||
                '...'
              } BALN`}
        </DataText>
      )}
    </ListItem>
  );
};

const PoolRecord1 = () => {
  const poolData = usePoolData(BalancedJs.utils.POOL_IDS.sICXICX);
  const pool = usePool(BalancedJs.utils.POOL_IDS.sICXICX);
  const upSmall = useMedia('(min-width: 800px)');
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  return (
    <ListItem>
      <StyledDataText>
        <DataText>{`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>
      <DataText>
        <Typography fontSize={16}>{`${balance1?.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          pool?.quoteToken.symbol || '...'
        }`}</Typography>
        <Typography fontSize={16}>{`${balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          pool?.baseToken.symbol || '...'
        }`}</Typography>
      </DataText>
      {upSmall && <DataText>{`${poolData?.poolShare.multiply(100).toFixed(4) || '...'}%`}</DataText>}
      {upSmall && <DataText>{`~ ${poolData?.suppliedReward.toFixed(4) || '...'} BALN`}</DataText>}
    </ListItem>
  );
};

const Withdraw1 = () => {
  const { account } = useIconReact();
  const pool = usePool(BalancedJs.utils.POOL_IDS.sICXICX);
  const addTransaction = useTransactionAdder();
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleCancelOrder = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Dex.cancelSicxIcxOrder()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: 'Withdrawing ICX',
            summary: `${balance1?.balance?.toFixed(2, { groupSeparator: ',' }) || '...'} ICX added to your wallet.`,
          },
        );
        toggleOpen1();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);

        changeShouldLedgerSign(false);
      });
  };

  const handleWithdrawEarnings = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    bnJs
      .inject({ account })
      .Dex.withdrawSicxEarnings()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: 'Withdrawing sICX',
            summary: `${balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX added to your wallet.`,
          },
        );
        toggleOpen2();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const [open1, setOpen1] = React.useState(false);
  const toggleOpen1 = () => {
    if (shouldLedgerSign) return;

    setOpen1(!open1);
  };
  const handleOption1 = () => {
    toggleOpen1();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
    if (shouldLedgerSign) return;

    setOpen2(!open2);
  };
  const handleOption2 = () => {
    toggleOpen2();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Flex flexDirection="column" alignItems="center">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">
            {`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}
          </Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton
            disabled={JSBI.equal(balance1?.balance1?.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption2}
            mr={2}
          >
            <CurrencyLogo currency={getTokenFromCurrencyKey('sICX')!} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX
            </Typography>
          </OptionButton>

          <OptionButton
            disabled={JSBI.equal(balance1?.balance.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption1}
          >
            <CurrencyLogo currency={getTokenFromCurrencyKey('ICX')!} size={'35px'} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance1?.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ICX
            </Typography>
          </OptionButton>
        </Flex>
      </Flex>

      <Modal isOpen={open1} onDismiss={toggleOpen1}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw liquidity?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {balance1?.balance.toFixed(2, { groupSeparator: ',' }) || '...'} {pool?.quoteToken.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen1}>Cancel</TextButton>
                <Button onClick={handleCancelOrder} disabled={!hasEnoughICX}>
                  Withdraw
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>

      <Modal isOpen={open2} onDismiss={toggleOpen2}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw sICX?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} {pool?.baseToken.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen2}>Cancel</TextButton>
                <Button onClick={handleWithdrawEarnings} disabled={!hasEnoughICX}>
                  Withdraw
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
};

const Wrapper = styled(Flex)`
  padding-left: 0;
  margin-left: 0;
  margin-top: 40px;
  flex-direction: column;
  border-left: none;

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding-left: 35px;
    margin-left: 35px;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    margin-top: 0;
  `}
`;

const Withdraw = ({ poolId }: { poolId: number }) => {
  const { account } = useIconReact();
  const pool = usePool(poolId);
  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [pool?.baseToken, pool?.quoteToken], [pool]),
  );
  const lpBalance = useBalance(poolId);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const onChangeWithdrawnValue = useChangeWithdrawnValue();

  const [{ typedValue, independentField, inputType, portion }, setState] = React.useState<{
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
    portion: number;
  }>({
    typedValue: '',
    independentField: Field.CURRENCY_A,
    inputType: 'text',
    portion: 0,
  });

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;
  const price =
    independentField === Field.CURRENCY_A ? pool?.price || FRACTION_ONE : pool?.inversePrice || FRACTION_ONE;

  let parsedAmount: { [field in Field]?: CurrencyAmount<Currency> }, formattedAmounts;

  const percent = new Percent(Math.floor(portion * 100), 10_000);
  const stakedLPPercent = useStakedLPPercent(poolId);
  const availablePercent = new BigNumber(100).minus(stakedLPPercent).abs();
  // new Percent(new BigNumber(100).minus(stakedLPPercent).toFixed(), 1);
  // const availableBase = new BigNumber(lpBalance?.base.toFixed() || 0).multipliedBy(availablePercent).dividedBy(100);
  const availableBase = lpBalance?.base.multiply(availablePercent.toFixed(0)).divide(100);

  // const availableQuote = new BigNumber(lpBalance?.quote.toFixed() || 0).multipliedBy(availablePercent).dividedBy(100);
  const availableQuote = lpBalance?.quote.multiply(availablePercent.toFixed(0)).divide(100);

  if (inputType === 'slider') {
    parsedAmount = {
      [Field.CURRENCY_A]: availableBase?.multiply(percent),
      [Field.CURRENCY_B]: availableQuote?.multiply(percent),
    };

    formattedAmounts = {
      [Field.CURRENCY_A]: parsedAmount[Field.CURRENCY_A]?.toSignificant(6) ?? '',
      [Field.CURRENCY_B]: parsedAmount[Field.CURRENCY_B]?.toSignificant(6) ?? '',
    };
  } else {
    const [independentToken, dependentToken] =
      independentField === Field.CURRENCY_A ? [pool?.baseToken, pool?.quoteToken] : [pool?.quoteToken, pool?.baseToken];

    parsedAmount = {
      [independentField]: tryParseAmount(typedValue, independentToken),
      [dependentField]: tryParseAmount(typedValue, dependentToken)?.multiply(price),
    };

    formattedAmounts = {
      [independentField]: typedValue,
      [dependentField]: parsedAmount[dependentField]?.toFixed(6) ?? '',
    };
  }

  const rate1 = pool ? pool.base.divide(pool.total) : FRACTION_ONE;
  const rate2 = pool ? pool.quote.divide(pool.total) : FRACTION_ONE;

  const handleFieldAInput = (value: string) => {
    if (availableBase) {
      const p = Math.min(new BigNumber(value || '0').div(availableBase.toFixed()).multipliedBy(100).toNumber(), 100);
      setState({ independentField: Field.CURRENCY_A, typedValue: value, inputType: 'text', portion: p });
    }
  };

  const handleFieldBInput = (value: string) => {
    if (availableQuote) {
      const p = Math.min(new BigNumber(value || '0').div(availableQuote.toFixed()).multipliedBy(100).toNumber(), 100);
      setState({ independentField: Field.CURRENCY_B, typedValue: value, inputType: 'text', portion: p });
    }
  };

  const handleSlide = (values: string[], handle: number) => {
    setState({
      typedValue,
      independentField,
      inputType: 'slider',
      portion: parseFloat(values[handle]),
    });
  };

  useEffect(() => {
    availableBase &&
      availableQuote &&
      onChangeWithdrawnValue(
        poolId,
        new BigNumber(portion),
        availableBase.multiply(percent),
        availableQuote.multiply(percent),
      );
  }, [portion, availableQuote, availableBase, poolId]);

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(portion);
    }
  }, [sliderInstance, inputType, portion]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const addTransaction = useTransactionAdder();

  const resetValue = () => {
    sliderInstance.current.noUiSlider.set(0);
    setState({ typedValue, independentField, inputType: 'slider', portion: 0 });
  };

  const handleWithdraw = () => {
    if (!account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const t = lpBalance
      ? multiplyCABN(lpBalance.balance, new BigNumber(portion / 100))
      : CurrencyAmount.fromRawAmount(pairToken(NETWORK_ID), 0);
    const baseT = t.multiply(rate1);
    const quoteT = t.multiply(rate2);

    bnJs
      .inject({ account })
      .Dex.remove(poolId, toHex(t))
      .then(result => {
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(
              baseT.toFixed(2, { groupSeparator: ',' }),
              pool?.baseToken?.symbol ?? '',
              quoteT.toFixed(2, { groupSeparator: ',' }),
              pool?.quoteToken?.symbol ?? '',
            ).pendingMessage,
            summary: withdrawMessage(
              baseT.toFixed(2, { groupSeparator: ',' }),
              pool?.baseToken?.symbol ?? '',
              quoteT.toFixed(2, { groupSeparator: ',' }),
              pool?.quoteToken?.symbol ?? '',
            ).successMessage,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        changeShouldLedgerSign(false);
        resetValue();
      });
  };

  const handleShowConfirm = () => {
    toggleOpen();
  };

  const hasEnoughICX = useHasEnoughICX();

  const availableCurrency = (stakedValue, suppliedValue) =>
    (!!stakedValue ? suppliedValue?.subtract(stakedValue) : suppliedValue)?.toFixed(2, { groupSeparator: ',' }) ||
    '...';

  return (
    <>
      <Wrapper>
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span" fontSize="16px" fontWeight="normal">
            {`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}
          </Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            currency={pool?.baseToken}
            onUserInput={handleFieldAInput}
            id="withdraw-liquidity-input"
            bg="bg2"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            currency={pool?.quoteToken}
            onUserInput={handleFieldBInput}
            id="withdraw-liquidity-input"
            bg="bg2"
          />
        </Box>
        <Typography mb={5} textAlign="right">
          {`Available: 
            ${availableCurrency(parsedAmount[Field.CURRENCY_A], availableBase)} ${pool?.baseToken?.symbol || '...'} /
            ${availableCurrency(parsedAmount[Field.CURRENCY_B], availableQuote)} ${pool?.quoteToken?.symbol || '...'}`}
          {/* {`Wallet: 
            ${balances[0]?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.baseToken?.symbol || '...'} /
            ${balances[1]?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.quoteToken?.symbol || '...'}`} */}
        </Typography>
        <Box mb={5}>
          <Nouislider
            start={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [100],
            }}
            step={0.01}
            onSlide={handleSlide}
            instanceRef={instance => {
              if (instance && !sliderInstance.current) {
                sliderInstance.current = instance;
              }
            }}
          />
        </Box>
        <Flex alignItems="center" justifyContent="center">
          <Button disabled={parsedAmount[Field.CURRENCY_A]?.equalTo(0)} onClick={handleShowConfirm}>
            Withdraw liquidity
          </Button>
        </Flex>
      </Wrapper>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw liquidity?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {parsedAmount[Field.CURRENCY_A]?.toFixed(2, { groupSeparator: ',' })} {pool?.baseToken?.symbol || '...'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {parsedAmount[Field.CURRENCY_B]?.toFixed(2, { groupSeparator: ',' })} {pool?.quoteToken?.symbol || '...'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen}>Cancel</TextButton>
                <Button onClick={handleWithdraw} disabled={!hasEnoughICX}>
                  Withdraw
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
};
