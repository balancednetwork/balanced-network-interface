import React from 'react';

import { getTotalTransactions } from 'apis';
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

const RowItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const { networkId } = useIconReact();

  const { indexed, method } = tx;
  const getValue = () => {
    let value = indexed.find(item => item.startsWith('0x'));
    return value ? BalancedJs.utils.toIcx(value).toNumber().toFixed(4) : '';
  };

  const getSign = () => {
    return '+';
  };

  const getContent = () => {
    let content = METHOD_CONTENT[method] || '';
    switch (method as keyof typeof METHOD_CONTENT) {
      case 'RewardsClaimed':
      case 'LoanRepaid':
      case 'CollateralReceived':
      case 'stake':
      case 'withdrawCollateral':
      case 'OriginateLoan':
      case 'cancelSicxicxOrder':
        return content.replace('(amount)', getValue());
      default:
        return method;
    }
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
        <span
          style={{
            color: getSign() === '+' ? '#2fccdc' : 'red',
          }}
        >
          {getSign()}
        </span>{' '}
        {getValue()} {getSymbol()}
      </Typography>
    </RowContent>
  );
};

const TransactionTable = () => {
  const { page, setPage } = usePagination();
  const limit = 10;

  const { isLoading, data } = useQuery<Transaction[]>(['transactions', page], () =>
    getAllTransactions({
      skip: page * limit,
      limit,
    }),
  );

  const { data: totalTx = 0 } = useQuery<number>('totalTransaction', async () => {
    const result = await getTotalTransactions();
    return result.total_transactions;
  });

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
        {data?.map(item => (
          <RowItem tx={item} key={item.item_id} />
        ))}
      </Table>
      <Pagination
        sx={{ mt: 2 }}
        onChangePage={page => {
          if (!isLoading) {
            setPage(page);
          }
        }}
        currentPage={page}
        totalPages={Math.floor(totalTx / limit)}
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
