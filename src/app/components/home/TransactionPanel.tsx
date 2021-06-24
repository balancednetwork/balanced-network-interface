import React, { useState, useEffect } from 'react';

import { getAllTransactions, Transaction } from 'apis/allTransaction';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
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
  RewardsClaimed: 'Claimed (amount) Balance Tokens',
  stake: 'Staked (amount) Balance Tokens',
  stakeICX: 'Swapped (amount) ICX for (amount) sICX',
  withdrawCollateral: 'Withdrew (amount) ICX collateral',
  AssetRetired: 'Retired (amount) bnUSD for (amount) sICX',
  LoanRepaid: 'Repaid (amount) Balanced Dollars',
  OriginateLoan: 'Borrowed (amount) Balanced Dollars',
  CollateralReceived: 'Deposited (amount) ICX as collateral ',
  cancelSicxicxOrder: 'Withdrew (amount) ICX from the ICX / sICX pool',
  Remove: 'Removed (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Swap: 'Swapped (amount1) (currency1) for (amount2) (currency2)',
  SupplyICX: 'Supplied (amount) ICX to the ICX / sICX pool',
  Withdraw: 'Withdrew (amount1) (currency1) and (amount2) (currency2) from the (currency1) / (currency2) pool',
  Add: 'Transferred (amount1) (currency1) and (amount2) (currency2) to the (currency1) / (currency2) pool',
  Deposit: 'Supplied (amount1) (currency1) and (amount2) (currency2) to the (currency1) / (currency2) pool',
};

const METHOD_WITH_2_SYMBOLS = ['Deposit', 'Add', 'Withdraw', 'Swap', 'Remove', 'AssetRetired', 'stakeICX'];
const METHOD_POSITIVE_SIGN = ['RewardsClaimed', 'withdrawCollateral', 'OriginateLoan', 'cancelSicxicxOrder'];

const RowItem: React.FC<{ tx: Transaction; secondTx?: Transaction }> = ({ tx, secondTx }) => {
  const { networkId } = useIconReact();

  const { indexed, method, data } = tx;
  const getValue = () => {
    let value = indexed.find(item => item.startsWith('0x')) || data.find(item => item.startsWith('0x'));
    return value ? BalancedJs.utils.toIcx(value).toNumber().toFixed(4) : '';
  };

  const getSecondValue = () => {
    if (!secondTx) return;
    const { indexed, data } = secondTx;
    let value = indexed.find(item => item.startsWith('0x')) || data.find(item => item.startsWith('0x'));
    return value ? BalancedJs.utils.toIcx(value).toNumber().toFixed(4) : '';
  };

  const getAmountWithSign = () => {
    const value = getValue();
    if (!secondTx) {
      const isPostive = METHOD_POSITIVE_SIGN.includes(method);
      return (
        <>
          {parseFloat(value) !== 0 && (
            <span
              style={{
                color: isPostive ? '#2fccdc' : 'red',
              }}
            >
              {isPostive ? '+' : '-'}{' '}
            </span>
          )}
          {value} {getSymbol()}
        </>
      );
    }
  };

  const getSecondSymbol = () => {
    return '';
  };

  const getContent = () => {
    let content = METHOD_CONTENT[method] || '';
    if (!secondTx) {
      const value = getValue();
      return content.replace('(amount)', value);
    }

    const value = getValue();
    const symbol = getSymbol();
    const secondValue = getSecondValue();
    const secondSymbol = getSecondSymbol();
    content.replace('(amount1)', value);
    content.replace('(currency1)', symbol);
    content.replace('(amount2)', secondValue);
    content.replace('(currency2)', secondSymbol);
  };

  const getSymbol = () => {
    return indexed.find(item => SYMBOLS.includes(item));
  };

  const trackerLink = () => {
    const hash = tx.item_id.split('_')[1];
    return getTrackerLink(networkId, hash, 'transaction');
  };

  return (
    <RowContent>
      <Typography>{dayjs(tx.block_timestamp).format('D MMMM, HH:mm')}</Typography>
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

  const { isLoading, data } = useQuery<{ count: number; transactions: Transaction[] }>(['transactions', page], () =>
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
      for (let i = 0; i < Math.min(10, txs.length); i++) {
        const tx = txs[i];
        if (tx.address) {
          let secondTx: Transaction | undefined;

          // check if this transaction has 2 symbols
          if (METHOD_WITH_2_SYMBOLS.includes(tx.method)) {
            const idx = txs.findIndex(
              item => item.transaction_hash === tx.transaction_hash && item.item_id !== tx.item_id,
            );
            // get the second transaction to merge to the first one
            secondTx = txs[idx];
            // delete from array
            if (secondTx) {
              txs.splice(idx, 1);
            }
          }

          console.log(tx);
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
