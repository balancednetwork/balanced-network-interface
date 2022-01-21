import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import lodash from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import Nouislider from 'packages/nouislider-react';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import CurrencyLogo from 'app/components/CurrencyLogo';
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { BIGINT_ZERO, FRACTION_ONE } from 'constants/misc';
import { useBalance, usePool, usePoolData, pairToken } from 'hooks/usePools';
import { useAvailablePairs, useBalances } from 'hooks/useV2Pairs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { tryParseAmount } from 'store/swap/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useTrackedTokenPairs } from 'store/user/hooks';
import { useCurrencyBalances, useHasEnoughICX } from 'store/wallet/hooks';
import { getTokenFromCurrencyKey } from 'types/adapter';
import { Currency, CurrencyAmount, Percent } from 'types/balanced-sdk-core';
import { multiplyCABN, toHex } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
import { withdrawMessage } from './utils';

export default function LiquidityDetails() {
  const upSmall = useMedia('(min-width: 800px)');

  const { account } = useIconReact();

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools in which the user has a balance
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const queuePair = pairs[BalancedJs.utils.POOL_IDS.sICXICX];
  const queueBalance = balances[BalancedJs.utils.POOL_IDS.sICXICX];

  const shouldShowQueue =
    queuePair &&
    queueBalance &&
    (JSBI.greaterThan(queueBalance.balance.quotient, BIGINT_ZERO) ||
      (queueBalance.balance1 && JSBI.greaterThan(queueBalance.balance1.quotient, BIGINT_ZERO)));

  if (!account || Object.keys(pairs).length === 0) return null;

  const pairsWithoutQ = lodash.omit(pairs, [BalancedJs.utils.POOL_IDS.sICXICX]);
  const balancesWithoutQ = lodash.omit(balances, [BalancedJs.utils.POOL_IDS.sICXICX]);

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

        {shouldShowQueue && <PoolRecord1 border={Object.keys(pairsWithoutQ).length !== 0} />}

        {balancesWithoutQ &&
          Object.keys(pairsWithoutQ).map((poolId, index, arr) => (
            <PoolRecord key={poolId} poolId={parseInt(poolId)} border={index !== arr.length - 1} />
          ))}
      </TableWrapper>
    </BoxPanel>
  );
}

const TableWrapper = styled.div``;

const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 4fr 5fr 3fr;
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
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
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

const ListItem = styled(DashGrid)<{ border?: boolean }>`
  padding: 20px 0;
  color: #ffffff;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};
`;

const PoolRecord = ({ poolId, border }: { poolId: number; border: boolean }) => {
  const poolData = usePoolData(poolId);
  const pool = usePool(poolId);
  const upSmall = useMedia('(min-width: 800px)');

  return (
    <ListItem border={border}>
      <DataText>{`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}</DataText>
      <DataText>
        {`${poolData?.suppliedBase?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.baseToken.symbol || '...'}`}
        <br />
        {`${poolData?.suppliedQuote?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.quoteToken.symbol || '...'}`}
      </DataText>
      {upSmall && <DataText>{`${poolData?.poolShare.multiply(100).toFixed(4) || '...'}%`}</DataText>}
      {upSmall && (
        <DataText>{`~ ${poolData?.suppliedReward.toFixed(4, { groupSeparator: ',' }) || '...'} BALN`}</DataText>
      )}
      <DataText>
        <WithdrawText poolId={poolId} />
      </DataText>
    </ListItem>
  );
};

const WithdrawText = ({ poolId }: { poolId: number }) => {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);

  const arrowRef = React.useRef(null);

  const toggle = () => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  const close = () => {
    setAnchor(null);
  };

  return (
    <ClickAwayListener onClickAway={close}>
      <div>
        <UnderlineTextWithArrow onClick={toggle} text="Withdraw" arrowRef={arrowRef} />
        <DropdownPopper show={Boolean(anchor)} anchorEl={anchor}>
          {poolId === BalancedJs.utils.POOL_IDS.sICXICX ? (
            <WithdrawModal1 onClose={close} />
          ) : (
            <WithdrawModal poolId={poolId} onClose={close} />
          )}
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
};

const PoolRecord1 = ({ border }: { border: boolean }) => {
  const poolData = usePoolData(BalancedJs.utils.POOL_IDS.sICXICX);
  const pool = usePool(BalancedJs.utils.POOL_IDS.sICXICX);
  const upSmall = useMedia('(min-width: 800px)');
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  return (
    <ListItem border={border}>
      <DataText>{`${pool?.baseToken.symbol || '...'} / ${pool?.quoteToken.symbol || '...'}`}</DataText>
      <DataText>
        <Typography fontSize={16}>{`${balance1?.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          pool?.quoteToken.symbol || '...'
        }`}</Typography>
        <Typography color="text1">{`${balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} ${
          pool?.baseToken.symbol || '...'
        }`}</Typography>
      </DataText>
      {upSmall && <DataText>{`${poolData?.poolShare.multiply(100).toFixed(4) || '...'}%`}</DataText>}
      {upSmall && <DataText>{`~ ${poolData?.suppliedReward.toFixed(4) || '...'} BALN`}</DataText>}
      <DataText>
        <WithdrawText poolId={BalancedJs.utils.POOL_IDS.sICXICX} />
      </DataText>
    </ListItem>
  );
};

const WithdrawModal1 = ({ onClose }: { onClose: () => void }) => {
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
    onClose();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
    if (shouldLedgerSign) return;

    setOpen2(!open2);
  };
  const handleOption2 = () => {
    toggleOpen2();
    onClose();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{`${pool?.baseToken.symbol || '...'} / ${
            pool?.quoteToken.symbol || '...'
          }`}</Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton
            disabled={JSBI.equal(balance1?.balance1?.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption2}
            mr={2}
          >
            <CurrencyLogo currency={getTokenFromCurrencyKey('sICX')!} size={'35px'} />
            <Typography>{balance1?.balance1?.toFixed(2, { groupSeparator: ',' }) || '...'} sICX</Typography>
          </OptionButton>

          <OptionButton
            disabled={JSBI.equal(balance1?.balance.quotient || BIGINT_ZERO, BIGINT_ZERO)}
            onClick={handleOption1}
          >
            <CurrencyLogo currency={getTokenFromCurrencyKey('ICX')!} size={'35px'} />
            <Typography>{balance1?.balance.toFixed(2, { groupSeparator: ',' }) || '...'} ICX</Typography>
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

const OptionButton = styled(Box)`
  width: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  text-align: center;
  background-color: ${({ theme }) => theme.colors.bg3};
  border: 2px solid #144a68;
  transition: border 0.3s ease;
  padding: 10px;
  transition: border 0.3s ease;

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

const WithdrawModal = ({ poolId, onClose }: { poolId: number; onClose: () => void }) => {
  const { account } = useIconReact();
  const pool = usePool(poolId);
  const balances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [pool?.baseToken, pool?.quoteToken], [pool]),
  );
  const lpBalance = useBalance(poolId);

  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();

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

  if (inputType === 'slider') {
    parsedAmount = {
      [Field.CURRENCY_A]: lpBalance?.base.multiply(percent),
      [Field.CURRENCY_B]: lpBalance?.quote.multiply(percent),
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
    if (lpBalance?.base) {
      const p = Math.min(new BigNumber(value || '0').div(lpBalance.base.toFixed()).multipliedBy(100).toNumber(), 100);
      setState({ independentField: Field.CURRENCY_A, typedValue: value, inputType: 'text', portion: p });
    }
  };

  const handleFieldBInput = (value: string) => {
    if (lpBalance?.quote) {
      const p = Math.min(new BigNumber(value || '0').div(lpBalance.quote.toFixed()).multipliedBy(100).toNumber(), 100);
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
      });
  };

  const handleShowConfirm = () => {
    toggleOpen();
    onClose();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{`${pool?.baseToken.symbol || '...'} / ${
            pool?.quoteToken.symbol || '...'
          }`}</Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            currency={pool?.baseToken}
            onUserInput={handleFieldAInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            currency={pool?.quoteToken}
            onUserInput={handleFieldBInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Typography mb={5} textAlign="right">
          {`Wallet: 
            ${balances[0]?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.baseToken?.symbol || '...'} /
            ${balances[1]?.toFixed(2, { groupSeparator: ',' }) || '...'} ${pool?.quoteToken?.symbol || '...'}`}
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
          <Button onClick={handleShowConfirm}>Withdraw liquidity</Button>
        </Flex>
      </Flex>

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
