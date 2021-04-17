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
import { Wrapper, UnderlineText, UnderlineTextWithArrow } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { DropdownPopper } from 'app/components/Popover';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCY_LIST, BASE_SUPPORTED_PAIRS } from 'constants/currency';
import { ONE, ZERO } from 'constants/index';
import { Field } from 'store/mint/actions';
import { useBalance, usePool, usePoolData, useAvailableBalances } from 'store/pool/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { formatBigNumber } from 'utils';

import { withdrawMessage } from './utils';

export default function LiquidityDetails() {
  const below800 = useMedia('(max-width: 800px)');
  const balances = useAvailableBalances();

  if (Object.keys(balances).length === 0) return null;

  return (
    <>
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
          {Object.keys(balances).map(poolId => (
            <PoolRecord key={poolId} poolId={parseInt(poolId)} />
          ))}
        </TableWrapper>
      </BoxPanel>
    </>
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
    grid-template-columns: 1.5fr 1.5fr 1fr;
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
  cursor: pointer;
  color: #ffffff;
  border-bottom: ${({ border = true }) => (border ? '1px solid rgba(255, 255, 255, 0.15)' : 'none')};

  :hover {
    color: #2ca9b7;
    transition: color 0.2s ease;
  }
`;

const PoolRecord = ({ poolId }: { poolId: number }) => {
  const pair = BASE_SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || BASE_SUPPORTED_PAIRS[0];
  const poolData = usePoolData(pair.poolId);
  const below800 = useMedia('(max-width: 800px)');

  return (
    <ListItem>
      <DataText>{pair.pair}</DataText>
      <DataText>
        {pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX ? (
          <>{`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}</>
        ) : (
          <>
            {`${formatBigNumber(poolData?.suppliedBase, 'currency')} ${pair.baseCurrencyKey}`}
            <br />
            {`${formatBigNumber(poolData?.suppliedQuote, 'currency')} ${pair.quoteCurrencyKey}`}
          </>
        )}
      </DataText>
      {!below800 && <DataText>{`${formatBigNumber(poolData?.poolShare, 'currency')}%`}</DataText>}
      {!below800 && <DataText>{`~ ${formatBigNumber(poolData?.suppliedReward, 'currency')} BALN`}</DataText>}
      <DataText>
        {pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX ? (
          <WithdrawText1 poolId={pair.poolId} />
        ) : (
          <WithdrawText poolId={pair.poolId} />
        )}
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
          <WithdrawModal poolId={poolId} onClose={close} />
        </DropdownPopper>
      </div>
    </ClickAwayListener>
  );
};

const WithdrawText1 = ({ poolId }: { poolId: number }) => {
  const pair = BASE_SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || BASE_SUPPORTED_PAIRS[0];
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const poolData = usePoolData(poolId);

  const handleWithdraw = () => {
    if (!account) return;
    bnJs
      .eject({ account: account })
      .Dex.cancelSicxIcxOrder()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            pending: withdrawMessage(poolData?.suppliedBase?.dp(2).toFormat() || '', 'ICX', '', 'sICX').pendingMessage,
            summary: withdrawMessage(poolData?.suppliedBase?.dp(2).toFormat() || '', 'ICX', '', 'sICX').successMessage,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      });
  };

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <>
      <Wrapper>
        <UnderlineText onClick={toggleOpen}>Withdraw</UnderlineText>
      </Wrapper>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={3} as="h3" fontWeight="normal">
            Withdraw liquidity?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {poolData?.suppliedBase?.dp(2).toFormat()} {pair.baseCurrencyKey}
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

const WithdrawModal = ({ poolId, onClose }: { poolId: number; onClose: () => void }) => {
  const pair = BASE_SUPPORTED_PAIRS.find(pair => pair.poolId === poolId) || BASE_SUPPORTED_PAIRS[0];
  const balances = useWalletBalances();
  const lpBalance = useBalance(poolId);
  const pool = usePool(pair.poolId);

  const [{ typedValue, independentField, inputType }, setState] = React.useState<{
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  }>({
    typedValue: '',
    independentField: Field.CURRENCY_A,
    inputType: 'text',
  });
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;
  const price = independentField === Field.CURRENCY_A ? pool?.rate || ONE : pool?.inverseRate || ONE;
  //  calculate dependentField value
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: new BigNumber(typedValue || '0').times(price),
  };

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmount[dependentField].isZero() ? '0' : parsedAmount[dependentField].toFixed(2),
  };

  const handleFieldAInput = (value: string) => {
    setState({ independentField: Field.CURRENCY_A, typedValue: value, inputType: 'text' });
  };

  const handleFieldBInput = (value: string) => {
    setState({ independentField: Field.CURRENCY_B, typedValue: value, inputType: 'text' });
  };

  const rate1 = pool ? pool.base.div(pool.total) : ONE;
  const rate2 = pool ? pool.quote.div(pool.total) : ONE;

  const handleSlide = (values: string[], handle: number) => {
    const t = new BigNumber(values[handle]).times(rate1);
    setState({ independentField: Field.CURRENCY_A, typedValue: t.dp(2).toFixed(), inputType: 'slider' });
  };

  const sliderInstance = React.useRef<any>(null);

  React.useEffect(() => {
    if (inputType === 'text') {
      const t = parsedAmount[Field.CURRENCY_A].div(rate1);
      sliderInstance.current.noUiSlider.set(t.dp(2).toNumber());
    }
  }, [parsedAmount, rate1, sliderInstance, inputType]);

  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();

  const handleWithdraw = () => {
    if (!account) return;

    const t = BigNumber.min(parsedAmount[Field.CURRENCY_A].div(rate1), lpBalance?.balance || ZERO);

    const baseT = t.times(rate1);
    const quoteT = t.times(rate2);

    bnJs
      .eject({ account: account })
      .Dex.remove(pair.poolId, BalancedJs.utils.toLoop(t))
      .then(result => {
        addTransaction(
          { hash: result.result },
          {
            pending: withdrawMessage(
              baseT.dp(2).toFormat(),
              pair.baseCurrencyKey,
              quoteT.dp(2).toFormat(),
              pair.quoteCurrencyKey,
            ).pendingMessage,
            summary: withdrawMessage(
              baseT.dp(2).toFormat(),
              pair.baseCurrencyKey,
              quoteT.dp(2).toFormat(),
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
            value={formattedAmounts[Field.CURRENCY_A]}
            showMaxButton={false}
            currency={CURRENCY_LIST[pair.baseCurrencyKey.toLowerCase()]}
            onUserInput={handleFieldAInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Box mb={3}>
          <CurrencyInputPanel
            value={formattedAmounts[Field.CURRENCY_B]}
            showMaxButton={false}
            currency={CURRENCY_LIST[pair.quoteCurrencyKey.toLowerCase()]}
            onUserInput={handleFieldBInput}
            id="withdraw-liquidity-input"
            bg="bg5"
          />
        </Box>
        <Typography mb={5} textAlign="right">
          {`Wallet: ${formatBigNumber(balances[pair.baseCurrencyKey], 'currency')} ${pair.baseCurrencyKey}
          / ${formatBigNumber(balances[pair.quoteCurrencyKey], 'currency')} ${pair.quoteCurrencyKey}`}
        </Typography>
        <Box mb={5}>
          <Nouislider
            id="slider-supply"
            start={[0]}
            padding={[0]}
            connect={[true, false]}
            range={{
              min: [0],
              max: [lpBalance?.balance.dp(2).toNumber() || 0],
            }}
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
            {parsedAmount[Field.CURRENCY_A].dp(2).toFormat()} {pair.baseCurrencyKey}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            {parsedAmount[Field.CURRENCY_B].dp(2).toFormat()} {pair.quoteCurrencyKey}
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
