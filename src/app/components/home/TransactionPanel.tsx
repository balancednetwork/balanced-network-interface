import React, { useState, useEffect } from 'react';

import { getAllTransactions, Transaction } from 'apis/allTransaction';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import addressses, { NetworkId } from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { Box, Flex, Link } from 'rebass/styled-components';
import styled from 'styled-components';

import Pagination, { usePagination } from 'app/components/Pagination';
import { BoxPanel } from 'app/components/Panel';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { getTrackerLink } from 'utils';

// import sample from './samples.json';
// import sample2 from './sample2.json';

const queryClient = new QueryClient();

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

const SYMBOLS = ['ICX', 'sICX', 'bnUSD', 'BALN'];
const METHOD_CONTENT = {
  SupplyICX: 'Supplied (amount) ICX to the ICX / sICX pool',
  RewardsClaimed: 'Claimed (amount) Balance Tokens',
  stake: 'Staked (amount) Balance Tokens',
  withdrawCollateral: 'Withdrew (amount) ICX collateral',
  LoanRepaid: 'Repaid (amount) Balanced Dollars',
  OriginateLoan: 'Borrowed (amount) Balanced Dollars',
  cancelSicxicxOrder: 'Withdrew (amount) ICX from the ICX / sICX pool',
  CollateralReceived: 'Deposited (amount) ICX as collateral ',
  Deposit: 'Transferred (amount) (currency) to DEX pool',
  Withdraw1Value: 'Withdrew (amount) (currency)',

  //  2 symbols
  Remove: 'Removed (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Swap: 'Swapped (amount1) (currency1) for (amount2) (currency2)',
  stakeICX: 'Swapped (amount1) ICX for (amount2) sICX',
  AssetRetired: 'Retired (amount) bnUSD for (amount) sICX',
  Withdraw: 'Withdrew (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Add: 'Supplied (amount1) (currency1) and (amount2) (currency2) to the (currency1) / (currency2) pool',
};

const METHOD_WITH_2_SYMBOLS = ['Withdraw', 'Swap', 'Remove', 'AssetRetired', 'stakeICX'];
const METHOD_POSITIVE_SIGN = ['RewardsClaimed', 'withdrawCollateral', 'OriginateLoan', 'cancelSicxicxOrder'];

const getContractName = (addr?: string) => {
  const name = Object.keys(addressses[NetworkId.MAINNET]).find(key => addressses[NetworkId.MAINNET][key] === addr);
  return SYMBOLS.find(item => item.toLowerCase() === name?.toLocaleLowerCase());
};

const POOL_IDS = {
  1: 'BALN sICX',
  2: 'BALN bnUSD',
  3: 'sICX bnUSD',
  4: 'sICX ICX',
};

const AmountItem = ({ value, symbol, positive }: { value: string; symbol: string; positive: boolean }) => (
  <>
    {parseFloat(value) !== 0 && (
      <span
        style={{
          color: positive ? '#2fccdc' : 'red',
        }}
      >
        {positive ? '+' : '-'}{' '}
      </span>
    )}
    {value} {symbol}
  </>
);

const convertValue = (value: string) => BalancedJs.utils.toIcx(value).toFixed(2);

const getValue = ({ indexed, data }: Transaction) => {
  let value = indexed.find(item => item.startsWith('0x')) || data.find(item => item.startsWith('0x'));
  return value ? convertValue(value) : '';
};

const getValuesAndSymbols = (tx: Transaction) => {
  const method = tx.method as keyof typeof METHOD_CONTENT;
  switch (method) {
    case 'Remove':
    case 'Add': {
      const poolId = parseInt(tx.indexed[1]);
      const [symbol1, symbol2] = POOL_IDS[poolId].split(' ');
      const amount1 = convertValue(tx.data[0]);
      const amount2 = convertValue(tx.data[1]);
      return { amount1, amount2, symbol1, symbol2 };
    }
    case 'Swap': {
      const symbol1 = getContractName(tx.data[0]);
      const symbol2 = getContractName(tx.data[1]);
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
    case 'stake':
    case 'RewardsClaimed': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'BALN', symbol2: '' };
    }
    case 'withdrawCollateral': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'sICX', symbol2: '' };
    }
    case 'cancelSicxicxOrder':
    case 'CollateralReceived': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'ICX', symbol2: '' };
    }
    case 'LoanRepaid':
    case 'OriginateLoan': {
      const amount1 = getValue(tx);
      return { amount1, amount2: '', symbol1: 'bnUSD', symbol2: '' };
    }
    default: {
      const amount1 = getValue(tx);
      const symbol1 = tx.indexed.find(item => SYMBOLS.includes(item)) || '';
      return { amount1, amount2: '', symbol1, symbol2: '' };
    }
  }
};

const RowItem: React.FC<{ tx: Transaction; secondTx?: Transaction }> = ({ tx, secondTx }) => {
  const { networkId } = useIconReact();

  const { indexed } = tx;
  const method = tx.method as keyof typeof METHOD_CONTENT;

  // handle merge 2 transaction
  const getSecondValue = () => {
    if (!secondTx) return '';
    const { indexed, data } = secondTx;
    let value = indexed.find(item => item.startsWith('0x')) || data.find(item => item.startsWith('0x'));
    return value ? convertValue(value) : '';
  };

  const getSecondSymbol = () => {
    return '';
  };

  const getSymbol = () => {
    return indexed.find(item => SYMBOLS.includes(item)) || '';
  };
  //============

  const getAmountWithSign = () => {
    if (!secondTx) {
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
              <AmountItem value={amount1} symbol={symbol1} positive={true} />
              <br />
              <AmountItem value={amount2} symbol={symbol2} positive={false} />
            </>
          );
        }
        case 'Withdraw': {
          const { amount1, symbol1 } = getValuesAndSymbols({ ...tx, method: 'Withdraw1Value' });
          return <AmountItem value={amount1} symbol={symbol1} positive />;
        }
        default:
          const positive = METHOD_POSITIVE_SIGN.includes(method);
          const { amount1, symbol1 } = getValuesAndSymbols(tx);
          return <AmountItem value={amount1} symbol={symbol1} positive={positive} />;
      }
    }

    // handle merge 2 transaction
  };

  const getContent = () => {
    let content = METHOD_CONTENT[method] || method;
    if (!secondTx) {
      switch (method) {
        case 'Deposit': {
          const { amount1, symbol1 } = getValuesAndSymbols(tx);
          content = content.replace('(currency)', symbol1);
          content = content.replace('(amount)', amount1);
          break;
        }
        case 'Remove':
        case 'Add':
        case 'Swap': {
          const { amount1, amount2, symbol1, symbol2 } = getValuesAndSymbols(tx);
          content = content.replace(/\(currency1\)/gi, symbol1);
          content = content.replace('(amount1)', amount1);
          content = content.replace(/\(currency2\)/gi, symbol2);
          content = content.replace('(amount2)', amount2);
          break;
        }

        case 'Withdraw': {
          content = METHOD_CONTENT.Withdraw1Value;
          const { amount1, symbol1 } = getValuesAndSymbols({ ...tx, method: 'Withdraw1Value' });
          content = content.replace('(currency)', symbol1);
          content = content.replace('(amount)', amount1);
          break;
        }

        default:
          const { amount1, symbol1 } = getValuesAndSymbols(tx);
          content = content.replace('(currency)', symbol1);
          content = content.replace('(amount)', amount1);
          break;
      }

      return content;
    }

    const value = getValue(tx);
    const symbol = getSymbol();
    const secondValue = getSecondValue();
    const secondSymbol = getSecondSymbol();
    content.replace('(amount1)', value);
    content.replace('(currency1)', symbol);
    content.replace('(amount2)', secondValue);
    content.replace('(currency2)', secondSymbol);

    return content;
  };

  const trackerLink = () => {
    const hash = tx.item_id.split('_')[1];
    return getTrackerLink(networkId, hash, 'transaction');
  };

  return (
    <RowContent>
      <Typography>{dayjs(tx.item_timestamp).format('D MMMM, HH:mm')}</Typography>
      <Flex>
        <Typography fontSize={16} sx={{ mr: '8px' }}>
          {getContent()}
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
        {getAmountWithSign()}
      </Typography>
    </RowContent>
  );
};

const TransactionTable = () => {
  const { account } = useIconReact();
  const { page, setPage } = usePagination();
  const [count, setCount] = useState(0);
  const limit = 10;

  const { isLoading, data } = useQuery<{ count: number; transactions: Transaction[] }>(
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

  const totalPages = Math.floor((data?.count || 0) / limit);
  useEffect(() => {
    totalPages && setCount(totalPages);
  }, [totalPages]);

  const getRows = () => {
    const rows: React.ReactElement[] = [];
    if (data?.transactions && data?.transactions?.length) {
      const { transactions: txs } = data;
      for (let i = 0; i < 10; i++) {
        const tx = txs[i];
        if (tx && tx.address) {
          let secondTx: Transaction | undefined;

          // check if this transaction has 2 symbols
          // if (METHOD_WITH_2_SYMBOLS.includes(tx.method)) {
          //   const idx = txs.findIndex(
          //     item =>
          //       item.transaction_hash === tx.transaction_hash &&
          //       item.item_id !== tx.item_id &&
          //       item.method === tx.method,
          //   );
          //   // get the second transaction to merge to the first one
          //   secondTx = txs[idx];
          //   // delete from array
          //   if (secondTx) {
          //     txs.splice(idx, 1);
          //   }
          // }

          rows.push(<RowItem secondTx={secondTx} tx={tx} key={tx.item_id} />);
        }
      }
    }

    return rows;
  };

  return (
    <BoxPanel bg="bg2">
      <Flex mb={2} alignItems="center">
        <Typography mr={2} variant="h2">
          Transaction history
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
  <QueryClientProvider client={queryClient}>
    <TransactionTable />
  </QueryClientProvider>
);

export default TransactionPanel;
