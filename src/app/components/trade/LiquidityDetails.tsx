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
import { UnderlineTextWithArrow } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import { ReactComponent as ICXIcon } from 'assets/logos/icx.svg';
import { ReactComponent as SICXIcon } from 'assets/logos/sicx.svg';
import bnJs from 'bnJs';
import { CURRENCY_LIST, BASE_SUPPORTED_PAIRS } from 'constants/currency';
import { ONE, ZERO } from 'constants/index';
import { useBalance, usePool, usePoolData, useAvailableBalances } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { formatBigNumber } from 'utils';

import { withdrawMessage } from './utils';

export default function LiquidityDetails() {
  const below800 = useMedia('(max-width: 800px)');
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
          {!below800 && <HeaderText>Pool share</HeaderText>}
          {!below800 && <HeaderText>Daily rewards</HeaderText>}
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
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-areas: 'name supply share rewards action';
  align-items: center;

  & > * {
    justify-content: flex-end;
    text-align: right;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 4fr 5fr 3fr;
    grid-template-areas: 'name supply action';
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
  const pair = BASE_SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || BASE_SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.poolId);
  const below800 = useMedia('(max-width: 800px)');

  return (
    <ListItem border={border}>
      <DataText>{pair.pair}</DataText>
      <DataText>
        {`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}
        <br />
        {`${formatBigNumber(poolData?.suppliedQuote, 'currency')} ${pair.quoteCurrencyKey}`}
      </DataText>
      {!below800 && <DataText>{`${formatBigNumber(poolData?.poolShare.times(100), 'currency')}%`}</DataText>}
      {!below800 && <DataText>{`~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}</DataText>}
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
  const pair = BASE_SUPPORTED_PAIRS[2];
  const poolData = usePoolData(pair.poolId);
  const below800 = useMedia('(max-width: 800px)');

  return (
    <ListItem border={border}>
      <DataText>{pair.pair}</DataText>
      <DataText>{`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}</DataText>
      {!below800 && <DataText>{`${formatBigNumber(poolData?.poolShare.times(100), 'currency')}%`}</DataText>}
      {!below800 && <DataText>{`~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}</DataText>}
      <DataText>
        <WithdrawText poolId={pair.poolId} />
      </DataText>
    </ListItem>
  );
};

const WithdrawModal1 = ({ onClose }: { onClose: () => void }) => {
  const { account } = useIconReact();
  const pair = BASE_SUPPORTED_PAIRS[2];
  const addTransaction = useTransactionAdder();
  const balance1 = useBalance(BalancedJs.utils.POOL_IDS.sICXICX);

  const handleCancelOrder = () => {
    bnJs
      .inject({ account })
      .Dex.cancelSicxIcxOrder()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: withdrawMessage(balance1?.balance?.dp(2).toFormat() || '', 'ICX', '', 'sICX').pendingMessage,
            summary: withdrawMessage(balance1?.balance?.dp(2).toFormat() || '', 'ICX', '', 'sICX').successMessage,
          },
        );
        toggleOpen1();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleWithdrawEarnings = () => {
    bnJs
      .inject({ account })
      .Dex.withdrawSicxEarnings()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: withdrawMessage(balance1?.balance1?.dp(2).toFormat() || '', 'ICX', '', 'sICX').pendingMessage,
            summary: withdrawMessage(balance1?.balance1?.dp(2).toFormat() || '', 'ICX', '', 'sICX').successMessage,
          },
        );
        toggleOpen1();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [open1, setOpen1] = React.useState(false);
  const toggleOpen1 = () => {
    setOpen1(!open1);
  };
  const handleOption1 = () => {
    toggleOpen1();
    onClose();
  };

  const [open2, setOpen2] = React.useState(false);
  const toggleOpen2 = () => {
    setOpen2(!open2);
  };
  const handleOption2 = () => {
    toggleOpen2();
    onClose();
  };

  return (
    <>
      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{pair.pair}</Typography>
        </Typography>

        <Flex alignItems="center" justifyContent="space-between">
          <OptionButton disabled={balance1?.balance.isZero()} onClick={handleOption1} mr={2}>
            <ICXIcon width="35" height="35" />
            <Typography>{balance1?.balance.dp(2).toFormat()} ICX</Typography>
          </OptionButton>

          <OptionButton disabled={balance1?.balance1?.isZero()} onClick={handleOption2}>
            <SICXIcon width="35" height="35" />
            <Typography>{balance1?.balance1?.dp(2).toFormat()} sICX</Typography>
          </OptionButton>
        </Flex>
      </Flex>

      <Modal isOpen={open1} onDismiss={toggleOpen1}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw liquidity?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formatBigNumber(balance1?.balance, 'currency')} {pair.baseCurrencyKey}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen1}>Cancel</TextButton>
            <Button onClick={handleCancelOrder}>Withdraw</Button>
          </Flex>
        </Flex>
      </Modal>

      <Modal isOpen={open2} onDismiss={toggleOpen2}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw sICX?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formatBigNumber(balance1?.balance1, 'currency')} {pair.quoteCurrencyKey}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen2}>Cancel</TextButton>
            <Button onClick={handleWithdrawEarnings}>Withdraw</Button>
          </Flex>
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
    background: #27264a;
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
  const pair = BASE_SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || BASE_SUPPORTED_PAIRS[0];
  const lpBalance = useBalance(poolId);
  const pool = usePool(pair.poolId);

  const rate1 = pool ? pool.base.div(pool.total) : ONE;
  const rate2 = pool ? pool.quote.div(pool.total) : ONE;
  const [portion, setPortion] = React.useState(new BigNumber(0));

  const tBalance = (lpBalance?.balance || ZERO).times(portion);
  const tBase = tBalance.times(rate1);
  const tQuote = tBalance.times(rate2);

  const handleSlide = (values: string[], handle: number) => {
    setPortion(new BigNumber(values[handle]));
  };

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();

  const handleWithdraw = () => {
    bnJs
      .inject({ account: account })
      .Dex.remove(pair.poolId, BalancedJs.utils.toLoop(tBalance))
      .then(result => {
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(
              formatBigNumber(tBase, 'currency'),
              pair.baseCurrencyKey,
              formatBigNumber(tQuote, 'currency'),
              pair.quoteCurrencyKey,
            ).pendingMessage,
            summary: withdrawMessage(
              formatBigNumber(tBase, 'currency'),
              pair.baseCurrencyKey,
              formatBigNumber(tQuote, 'currency'),
              pair.quoteCurrencyKey,
            ).successMessage,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const handleShowConfirm = () => {
    toggleOpen();
    onClose();
  };

  return (
    <>
      <Flex padding={5} bg="bg4" maxWidth={320} flexDirection="column">
        <Typography variant="h3" mb={3}>
          Withdraw:&nbsp;
          <Typography as="span">{pair.pair}</Typography>
        </Typography>
        <Box mb={3}>
          <CurrencyInputPanel
            value={tBase?.dp(2).toFormat() || ''}
            showMaxButton={false}
            currency={CURRENCY_LIST[pair.baseCurrencyKey.toLowerCase()]}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={tQuote?.dp(2).toFormat() || ''}
            showMaxButton={false}
            currency={CURRENCY_LIST[pair.quoteCurrencyKey.toLowerCase()]}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Typography variant="h1" mb={3}>
          {portion.times(100).integerValue().toFormat()}%
        </Typography>
        <Box mb={5}>
          <Nouislider
            start={[0]}
            range={{
              min: [0],
              max: [1],
            }}
            step={0.01}
            onSlide={handleSlide}
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
            {formatBigNumber(tBase, 'currency')} {pair.baseCurrencyKey}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {formatBigNumber(tQuote, 'currency')} {pair.quoteCurrencyKey}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen}>Cancel</TextButton>
            <Button onClick={handleWithdraw}>Withdraw</Button>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
};
