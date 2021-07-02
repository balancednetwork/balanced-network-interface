import React, { useState, useEffect } from 'react';

import { getAllTransactions, Transaction } from 'apis/allTransaction';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import addresses, { NetworkId } from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';
import { Box, Flex, Link } from 'rebass/styled-components';
import styled from 'styled-components';

import Pagination, { usePagination } from 'app/components/Pagination';
import { BoxPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { CURRENCY } from 'constants/currency';
import { formatBigNumber, getTrackerLink } from 'utils';

const Row = styled(Box)`
  display: grid;
  padding: 20px 0;
  grid-template-columns: 25% 1fr;
  align-items: center;
  grid-column-gap: 20px;
  > div:last-child,
  > p:last-child {
    display: none;
  }

  ${({ theme }) => theme.mediaWidth.upLarge`
    grid-template-columns: 17% 1fr 15%;
    > div:last-child,
    > p:last-child {
      display: block;
    }
  `}
`;

const RowContent = styled(Row)`
  border-bottom: 1px solid #304a68;
`;

const Table = styled(Box)`
  > div:last-child {
    border-bottom: 0;
  }
`;

const METHOD_CONTENT = {
  SupplyICX: 'Supplied (amount) ICX to the ICX / sICX pool',
  RewardsClaimed: 'Claimed (amount) BALN',
  stake: 'Adjusted BALN stake',
  withdrawCollateral: 'Withdrew (amount) sICX collateral',
  LoanRepaid: 'Repaid (amount) bnUSD',
  OriginateLoan: 'Borrowed (amount) bnUSD',
  cancelSicxicxOrder: 'Withdrew (amount) ICX from the ICX / sICX pool',
  ClaimSicxEarnings: 'Withdrew (amount) sICX from the ICX / sICX pool',
  CollateralReceived: 'Deposited (amount) sICX as collateral ',
  UnstakeRequest: 'Unstaked (amount) sICX',
  Deposit: 'Transferred (amount) (currency) to DEX pool',
  Withdraw1Value: 'Withdrew (amount) (currency)',
  stakeICX: 'Swapped (amount) ICX',
  VoteCast: '',

  //  2 symbols
  Remove: 'Removed (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Swap: 'Swapped (amount1) (currency1) for (amount2) (currency2)',
  AssetRetired: 'Retired (amount) bnUSD for (amount) sICX',
  Withdraw: 'Withdrew (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Add: 'Supplied (amount1) (currency1) and (amount2) (currency2) to the (currency1) / (currency2) pool',
};

const METHOD_POSITIVE_SIGN = [
  'ClaimSicxEarnings',
  'RewardsClaimed',
  'withdrawCollateral',
  'OriginateLoan',
  'cancelSicxicxOrder',
  'Withdraw1Value',
];

const getContractName = (addr?: string) => {
  const name = Object.keys(addresses[NetworkId.MAINNET]).find(key => addresses[NetworkId.MAINNET][key] === addr);
  return CURRENCY.find(item => item.toLowerCase() === name?.toLocaleLowerCase());
};

const POOL_IDS = {
  4: 'BALN sICX',
  3: 'BALN bnUSD',
  2: 'sICX bnUSD',
  1: 'sICX ICX',
};

const AmountItem = ({ value, symbol, positive }: { value: string; symbol: string; positive?: boolean }) => (
  <>
    {parseFloat(value) !== 0 && (
      <span
        style={{
          color: positive !== undefined ? (positive ? '#2fccdc' : 'red') : '',
        }}
      >
        {positive !== undefined && (positive ? '+' : '-')}{' '}
      </span>
    )}
    {value} {symbol}
  </>
);

const convertValue = (value: string) =>
  BalancedJs.utils.toIcx(value).isGreaterThan(0.004) ? formatBigNumber(BalancedJs.utils.toIcx(value), 'currency') : '';

const getValue = ({ indexed, data, value }: Transaction) => {
  let _value =
    indexed?.find(item => item.startsWith('0x')) || (data?.find && data?.find(item => item.startsWith('0x'))) || value;

  return _value ? convertValue(_value) : '';
};

const getMethod = (tx: Transaction) => {
  let method: keyof typeof METHOD_CONTENT = tx.method as any;
  if (!method) {
    method = (tx.data as any)?.method as any;
  }
  return method;
};

const getValuesAndSymbols = (tx: Transaction) => {
  const method = getMethod(tx);
  switch (method) {
    case 'stake': {
      const amount1 = convertValue((tx.data as any)?.params?._value || 0);
      return { amount1, amount2: '', symbol1: 'BALN', symbol2: '' };
    }
    case 'Remove':
    case 'Add': {
      const poolId = parseInt(tx.indexed[1]);
      const [symbol1, symbol2] = POOL_IDS[poolId].split(' ');
      const amount1 = convertValue(tx.data[0]);
      const amount2 = convertValue(tx.data[1]);
      return { amount1, amount2, symbol1, symbol2 };
    }
    case 'Swap': {
      let symbol1 = getContractName(tx.data[0]);
      let symbol2 = getContractName(tx.data[1]);

      if (!symbol2) {
        symbol1 = 'sICX';
        symbol2 = 'ICX';
      }
      const amount1 = convertValue(tx.data[4]);
      const amount2 = convertValue(tx.data[5]);
      return { amount1, amount2, symbol1, symbol2 };
    }
    case 'Withdraw1Value':
    case 'Deposit': {
      const symbol1 = getContractName(tx.indexed.find(item => item.startsWith('cx'))) || '';
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1, symbol2: '' };
    }
    case 'UnstakeRequest': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'RewardsClaimed': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'BALN', symbol2: '' };
    }
    case 'withdrawCollateral': {
      const amount1 = convertValue((tx.data as any)?.params?._value || 0);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'cancelSicxicxOrder':
    case 'stakeICX':
    case 'CollateralReceived': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'ICX', symbol2: '' };
    }
    case 'ClaimSicxEarnings': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'LoanRepaid':
    case 'OriginateLoan': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'bnUSD', symbol2: '' };
    }
    case 'Withdraw': {
      const amount1 = convertValue(tx.data.fromValue);
      const symbol1 = getContractName(tx.data.from);
      const amount2 = convertValue(tx.data.toValue);
      const symbol2 = getContractName(tx.data.to);
      return { amount1, amount2, symbol1, symbol2 };
    }
    default: {
      const amount1 = getValue(tx);
      const symbol1 = tx.indexed?.find(item => CURRENCY.includes(item)) || '';
      return { amount1, amount2: '', symbol1, symbol2: '' };
    }
  }
};

const getAmountWithSign = (tx: Transaction) => {
  const method = getMethod(tx);
  switch (method) {
    case 'Remove': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive />
          <br />
          <AmountItem value={amount2} symbol={symbol2} positive />
        </>
      );
    }
    case 'Withdraw': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive />
          <br />
          <AmountItem value={amount2} symbol={symbol2} positive />
        </>
      );
    }
    case 'Add': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive={false} />
          <br />
          <AmountItem value={amount2} symbol={symbol2} positive={false} />
        </>
      );
    }
    case 'Swap': {
      const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
      return (
        <>
          <AmountItem value={amount1} symbol={symbol1} positive={false} />
          <br />
          <AmountItem value={amount2} symbol={symbol2} positive={true} />
        </>
      );
    }
    case 'ClaimSicxEarnings': {
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} positive />;
    }

    case 'VoteCast':
      return '';

    case 'stake': {
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} />;
    }

    default:
      const positive = METHOD_POSITIVE_SIGN.includes(method);
      const { amount1, symbol1 } = getValuesAndSymbols(tx);
      return <AmountItem value={amount1} symbol={symbol1} positive={positive} />;
  }

  // handle merge 2 transaction
};

const RowItem: React.FC<{ tx: Transaction; secondTx?: Transaction }> = ({ tx, secondTx }) => {
  const { networkId } = useIconReact();

  const method = tx.method as keyof typeof METHOD_CONTENT;

  const getContent = () => {
    let content = METHOD_CONTENT[method] || method;
    switch (method) {
      // case 'Deposit': {
      //   const { amount1, symbol1 } = getValuesAndSymbols(tx);
      //   if (!amount1) {
      //     content = '';
      //   } else {
      //     content = content.replace('(currency)', symbol1);
      //     content = content.replace('(amount)', amount1);
      //   }
      //   break;
      // }
      case 'Remove':
      case 'Add':
      case 'Withdraw':
      case 'Swap': {
        const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
        if (!amount1 || !amount2) {
          content = '';
        } else {
          content = content.replace(/\(currency1\)/gi, symbol1);
          content = content.replace('(amount1)', amount1);
          content = content.replace(/\(currency2\)/gi, symbol2);
          content = content.replace('(amount2)', amount2);
        }
        break;
      }

      case 'VoteCast': {
        const approved = tx.indexed.find(item => item === '0x1');
        content = approved ? 'Approved a proposal' : 'Rejected a proposal';
        break;
      }

      default:
        const { amount1, symbol1 } = getValuesAndSymbols(tx);
        if (!amount1) {
          content = '';
        } else {
          content = content.replace('(currency)', symbol1);
          content = content.replace('(amount)', amount1);
        }
        break;
    }

    return content;
  };

  const trackerLink = () => {
    const hash = tx.item_id.split('_')[1];
    return getTrackerLink(networkId, hash, 'transaction');
  };

  const content = getContent();
  if (!content) return null;

  return (
    <RowContent>
      <Typography>{dayjs(tx.item_timestamp).format('D MMMM, HH:mm')}</Typography>
      <Flex>
        <Typography fontSize={16} sx={{ mr: '8px' }}>
          {content}
        </Typography>
        <Link
          href={trackerLink()}
          target="_blank"
          rel="noreferrer noopener"
          sx={{
            display: 'inline-flex',
            paddingBottom: 2,
          }}
        >
          <ExternalIcon width="11px" height="11px" />
        </Link>
      </Flex>
      <Typography fontSize={16} textAlign="right">
        {getAmountWithSign(tx)}
      </Typography>
    </RowContent>
  );
};

const TransactionTable = () => {
  const { account } = useIconReact();
  const { page, setPage } = usePagination();
  const [count, setCount] = useState(0);
  const limit = 10;

  const { isLoading, data } = useQuery<{ count: number; transactions: any }>(
    ['transactions', page, account],
    // () => sample2,
    () =>
      account
        ? getAllTransactions({
            skip: page * limit,
            limit: 20, // this is to handle merging transaction
            from_address: account,
          })
        : { count: 0, transactions: [] },
  );

  const totalPages = Math.ceil((data?.count || 0) / limit);
  useEffect(() => {
    totalPages && setCount(totalPages);
  }, [totalPages]);

  const getRows = () => {
    const rows: React.ReactElement[] = [];
    const txs = (data?.transactions as any) as Transaction[];
    if (txs && txs?.length) {
      for (let i = 0; i < 10; i++) {
        const tx = { ...txs[i] };
        if (tx && (tx.data || tx.indexed) && !tx.ignore) {
          if (getMethod(tx) === 'Withdraw') {
            // check if this is merging withdraw (2 tx and 1 tx remove)
            const mergeTxs = [tx];
            for (let j = i + 1; j < txs.length; j++) {
              const _tx = txs[j];
              const _method = getMethod(_tx);
              if (_tx.transaction_hash === tx.transaction_hash && ['Withdraw', 'Remove'].includes(_method)) {
                // ignore Remove, no need to show on ui
                if (_method === 'Withdraw') {
                  mergeTxs.push(_tx);
                }
                // mark ignored field
                _tx.ignore = true;
              }
            }

            if (mergeTxs.length === 2) {
              const mergeData = {
                from: mergeTxs[1].indexed.find(item => item.startsWith('cx')),
                fromValue: mergeTxs[1].data[0],
                to: mergeTxs[0].indexed.find(item => item.startsWith('cx')),
                toValue: mergeTxs[0].data[0],
              };
              tx.data = mergeData;
            } else {
              tx.method = 'Withdraw1Value';
            }
          }
          rows.push(<RowItem tx={tx} key={tx.item_id} />);
        }
      }
    }

    return rows;
  };

  return (
    <BoxPanel bg="bg2">
      <Flex mb={2} alignItems="center">
        <Typography mr={2} variant="h2">
          Activity history
        </Typography>
        {isLoading && <Spinner />}
      </Flex>
      <Table>
        <Row>
          <Typography letterSpacing="3px">DATE</Typography>
          <Typography letterSpacing="3px" sx={{ flex: 1 }}>
            ACTIVITY
          </Typography>
          <Typography letterSpacing="3px" textAlign="right">
            AMOUNT
          </Typography>
        </Row>
        {getRows()}
      </Table>
      <Pagination
        sx={{ mt: 2 }}
        onChangePage={page => {
          if (!isLoading) {
            setPage(page);
          }
        }}
        currentPage={page}
        totalPages={count}
        displayPages={7}
      />
    </BoxPanel>
  );
};

const TransactionPanel = () => (
  <Box sx={{ gridColumn: ['auto', 'auto', 'auto', '1 / span 2'] }}>
    <TransactionTable />
  </Box>
);

export default TransactionPanel;
