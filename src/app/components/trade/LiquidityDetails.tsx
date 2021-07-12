import React from 'react';

import BigNumber from 'bignumber.js';
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
import { SUPPORTED_PAIRS } from 'constants/currency';
import { ONE, ZERO } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { Field } from 'store/mint/actions';
import { useBalance, usePool, usePoolData, useAvailableBalances } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import CurrencyBalanceErrorMessage from '../CurrencyBalanceErrorMessage';
import Spinner from '../Spinner';
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

        {!isHidden && <PoolRecord1 border={Object.keys(balances).length !== 0} />}

        {Object.keys(balances).map((poolId, index, arr) => (
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
  const pair = SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.poolId);
  const upSmall = useMedia('(min-width: 800px)');

  return (
    <ListItem border={border}>
      <DataText>{pair.pair}</DataText>
      <DataText>
        {`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}
        <br />
        {`${formatBigNumber(poolData?.suppliedQuote, 'currency')} ${pair.quoteCurrencyKey}`}
      </DataText>
      {upSmall && <DataText>{`${formatBigNumber(poolData?.poolShare.times(100), 'currency')}%`}</DataText>}
      {upSmall && <DataText>{`~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}</DataText>}
      <DataText>
        <WithdrawText poolId={pair.poolId} />
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
  const pair = SUPPORTED_PAIRS.find(pair => pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) || SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.poolId);
  const upSmall = useMedia('(min-width: 800px)');
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  return (
    <ListItem border={border}>
      <DataText>{pair.pair}</DataText>
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
      <DataText>
        <WithdrawText poolId={pair.poolId} />
      </DataText>
    </ListItem>
  );
};

const WithdrawModal1 = ({ onClose }: { onClose: () => void }) => {
  const { account } = useIconReact();
  const pair = SUPPORTED_PAIRS.find(pair => pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) || SUPPORTED_PAIRS[0];
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
    setOpen1(!open1);
    changeShouldLedgerSign(false);
  };
  const handleOption1 = () => {
    toggleOpen1();
    onClose();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
    setOpen2(!open2);
    changeShouldLedgerSign(false);
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
          <Typography as="span">{pair.pair}</Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton disabled={balance1?.balance1?.isZero()} onClick={handleOption2} mr={2}>
            <CurrencyLogo currencyKey="sICX" size={35} />
            <Typography>{balance1?.balance1?.dp(2).toFormat()} sICX</Typography>
          </OptionButton>

          <OptionButton disabled={balance1?.balance.isZero()} onClick={handleOption1}>
            <CurrencyLogo currencyKey="ICX" size={35} />
            <Typography>{balance1?.balance.dp(2).toFormat()} ICX</Typography>
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
  const pair = SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || SUPPORTED_PAIRS[0];
  const balances = useWalletBalances();
  const lpBalance = useBalance(poolId);
  const pool = usePool(pair.poolId);

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
    setOpen(!open);
    changeShouldLedgerSign(false);
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
      .inject({ account: account })
      .Dex.remove(pair.poolId, BalancedJs.utils.toLoop(t))
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
    onClose();
  };

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{pair.pair}</Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_A]}
            showMaxButton={false}
            currency={pair.baseCurrencyKey}
            onUserInput={handleFieldAInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            showMaxButton={false}
            currency={pair.quoteCurrencyKey}
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
      </Flex>

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
