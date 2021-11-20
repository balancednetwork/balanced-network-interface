import React from 'react';

import { Accordion, AccordionItem, AccordionButton, AccordionPanel } from '@reach/accordion';
import BigNumber from 'bignumber.js';
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
import { ONE, ZERO } from 'constants/index';
import { SUPPORTED_PAIRS } from 'constants/pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useBalance, usePool, usePoolData, useAvailableBalances } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { getTokenFromCurrencyKey } from 'types/adapter';
import { formatBigNumber, getPairName } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import StakeLPPanel from './StakeLPPanel';
import { withdrawMessage } from './utils';

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');
  const balances = useAvailableBalances();

  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  const isHidden = !balance1 || (balance1.balance.isZero() && (balance1.balance1 || ZERO).isZero());

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
                <PoolRecord poolId={parseInt(poolId)} />
              </StyledAccordionButton>
              <StyledAccordionPanel hidden={false}>
                <StyledBoxPanel bg="bg3">
                  <StakeLPPanel poolId={parseInt(poolId)} />
                  <Withdraw poolId={parseInt(poolId)} />
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

  > svg {
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
  const pair = SUPPORTED_PAIRS.find(pair => pair.id === poolId) || SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.id);
  const upSmall = useMedia('(min-width: 800px)');

  return (
    <ListItem>
      <StyledDataText>
        <DataText>{getPairName(pair)}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>
      <DataText>
        {`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}
        <br />
        {`${formatBigNumber(poolData?.suppliedQuote, 'currency')} ${pair.quoteCurrencyKey}`}
      </DataText>
      {upSmall && <DataText>{`${formatBigNumber(poolData?.poolShare.times(100), 'currency')}%`}</DataText>}
      {upSmall && (
        <DataText>
          {formatBigNumber(poolData?.suppliedReward, 'currency') === '0'
            ? 'ー'
            : `~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}
        </DataText>
      )}
    </ListItem>
  );
};

const PoolRecord1 = () => {
  const pair = SUPPORTED_PAIRS.find(pair => pair.id === BalancedJs.utils.POOL_IDS.sICXICX) || SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.id);
  const upSmall = useMedia('(min-width: 800px)');
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  return (
    <ListItem>
      <StyledDataText>
        <DataText>{getPairName(pair)}</DataText>
        <StyledArrowDownIcon />
      </StyledDataText>
      <DataText>
        <Typography fontSize={16}>
          {`${formatBigNumber(balance1?.balance, 'currency')} ${pair.quoteCurrencyKey}`}
        </Typography>
        <Typography color="text1">
          {`${formatBigNumber(balance1?.balance1, 'currency')} ${pair.baseCurrencyKey}`}
        </Typography>
      </DataText>
      {upSmall && <DataText>{`${formatBigNumber(poolData?.poolShare.times(100), 'currency')}%`}</DataText>}
      {upSmall && <DataText>{`~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}</DataText>}
    </ListItem>
  );
};

const Withdraw1 = () => {
  const { account } = useIconReact();
  const pair = SUPPORTED_PAIRS.find(pair => pair.id === BalancedJs.utils.POOL_IDS.sICXICX) || SUPPORTED_PAIRS[0];
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
            summary: `${balance1?.balance?.dp(2).toFormat()} ICX added to your wallet.`,
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
            summary: `${balance1?.balance1?.dp(2).toFormat()} sICX added to your wallet.`,
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
          <Typography as="span" fontSize="16px">
            {getPairName(pair)}
          </Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton disabled={balance1?.balance1?.isZero()} onClick={handleOption2} mr={2}>
            <CurrencyLogo currency={getTokenFromCurrencyKey('sICX')!} size={35} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance1?.balance1?.dp(2).toFormat()} sICX
            </Typography>
          </OptionButton>

          <OptionButton disabled={balance1?.balance.isZero()} onClick={handleOption1}>
            <CurrencyLogo currency={getTokenFromCurrencyKey('ICX')!} size={35} />
            <Typography fontSize="16px" fontWeight="bold">
              {balance1?.balance.dp(2).toFormat()} ICX
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
            {formatBigNumber(balance1?.balance, 'currency')} {pair.quoteCurrencyKey}
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
            {formatBigNumber(balance1?.balance1, 'currency')} {pair.baseCurrencyKey}
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
  const pair = SUPPORTED_PAIRS.find(pair => pair.id === poolId) || SUPPORTED_PAIRS[0];
  const balances = useWalletBalances();
  const lpBalance = useBalance(poolId);
  const pool = usePool(pair.id);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const [{ typedValue, independentField, inputType, portion }, setState] = React.useState<{
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
    portion: BigNumber;
  }>({
    typedValue: '',
    independentField: Field.CURRENCY_A,
    inputType: 'text',
    portion: ZERO,
  });
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;
  const price = independentField === Field.CURRENCY_A ? pool?.rate || ONE : pool?.inverseRate || ONE;

  let parsedAmount, formattedAmounts;

  if (inputType === 'slider') {
    parsedAmount = {
      [Field.CURRENCY_A]: lpBalance?.base.times(portion) || ZERO,
      [Field.CURRENCY_B]: lpBalance?.quote.times(portion) || ZERO,
    };

    formattedAmounts = {
      [Field.CURRENCY_A]: parsedAmount[Field.CURRENCY_A].toFixed(2),
      [Field.CURRENCY_B]: parsedAmount[Field.CURRENCY_B].toFixed(2),
    };
  } else {
    parsedAmount = {
      [independentField]: new BigNumber(typedValue || '0'),
      [dependentField]: new BigNumber(typedValue || '0').times(price),
    };

    formattedAmounts = {
      [independentField]: typedValue,
      [dependentField]: parsedAmount[dependentField].isZero()
        ? ''
        : formatBigNumber(parsedAmount[dependentField], 'input').toString(),
    };
  }

  const rate1 = pool ? pool.base.div(pool.total) : ONE;
  const rate2 = pool ? pool.quote.div(pool.total) : ONE;

  const handleFieldAInput = (value: string) => {
    const p = new BigNumber(value || '0').div(lpBalance?.base || ONE);
    setState({ independentField: Field.CURRENCY_A, typedValue: value, inputType: 'text', portion: p });
  };

  const handleFieldBInput = (value: string) => {
    const p = new BigNumber(value || '0').div(lpBalance?.quote || ONE);
    setState({ independentField: Field.CURRENCY_B, typedValue: value, inputType: 'text', portion: p });
  };

  const handleSlide = (values: string[], handle: number) => {
    setState({ typedValue, independentField, inputType: 'slider', portion: new BigNumber(values[handle]).div(100) });
  };

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      sliderInstance.current.noUiSlider.set(portion.times(100).dp(2).toNumber());
    }
  }, [sliderInstance, inputType, portion]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();

  const handleWithdraw = () => {
    if (!account) return;
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const t = lpBalance?.balance.times(portion) || ZERO;
    const baseT = t.times(rate1);
    const quoteT = t.times(rate2);

    bnJs
      .inject({ account })
      .Dex.remove(pair.id, BalancedJs.utils.toLoop(t))
      .then(result => {
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(
              formatBigNumber(baseT, 'currency'),
              pair.baseCurrencyKey,
              formatBigNumber(quoteT, 'currency'),
              pair.quoteCurrencyKey,
            ).pendingMessage,
            summary: withdrawMessage(
              formatBigNumber(baseT, 'currency'),
              pair.baseCurrencyKey,
              formatBigNumber(quoteT, 'currency'),
              pair.quoteCurrencyKey,
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
      });
  };

  const handleShowConfirm = () => {
    toggleOpen();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Wrapper>
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{getPairName(pair)}</Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            showMaxButton={false}
            currency={getTokenFromCurrencyKey(pair.baseCurrencyKey)}
            onUserInput={handleFieldAInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            showMaxButton={false}
            currency={getTokenFromCurrencyKey(pair.quoteCurrencyKey)}
            onUserInput={handleFieldBInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Typography mb={5} textAlign="right">
          {`Wallet: 
            ${formatBigNumber(balances[pair.baseCurrencyKey], 'currency')} ${pair.baseCurrencyKey} /
            ${formatBigNumber(balances[pair.quoteCurrencyKey], 'currency')} ${pair.quoteCurrencyKey}`}
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
          <Button disabled={portion.isGreaterThan(ONE)} onClick={handleShowConfirm}>
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
            {formatBigNumber(parsedAmount[Field.CURRENCY_A], 'currency')} {pair.baseCurrencyKey}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formatBigNumber(parsedAmount[Field.CURRENCY_B], 'currency')} {pair.quoteCurrencyKey}
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
