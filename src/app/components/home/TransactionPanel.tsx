import '@reach/tabs/styles.css';
import React, { useMemo } from 'react';

import { getLoanTransation, getTotalTransactions, Transaction } from 'apis';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { Box, Flex, Link } from 'rebass';
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

const RETURN_ASSET = 'returnAsset';
const WITHDRAWN = 'withdrawCollateral';

const RowItem: React.FC<{ tx: Transaction }> = ({ tx }) => {
  const { networkId } = useIconReact();

  const {
    data: {
      params: { _value },
      method,
    },
  } = tx;
  const amount = _value ? BalancedJs.utils.toIcx(_value).toNumber().toFixed(4) : 0;
  const sign = useMemo(() => {
    if (amount > 0) return '+';
    if (amount < 0) return '-';
  }, [amount]);

  const content = useMemo(() => {
    switch (method) {
      case RETURN_ASSET:
        return `Repaid ${amount} Balanced Dollars`;
      case WITHDRAWN:
        return `Withdrew ${amount} ICX collateral`;
      default:
        return method;
    }
  }, [method, amount]);

  const trackerLink = useMemo(() => {
    const hash = tx.item_id.split('_')[1];
    return getTrackerLink(networkId, hash, 'transaction');
  }, [networkId, tx.item_id]);

  return (
    <RowContent>
      <Typography>{dayjs(tx.block_timestamp).format('D MMMM, HH:mm')}</Typography>
      <Flex>
        <Typography fontSize={16} sx={{ mr: '8px' }}>
          {content}
        </Typography>
        <Link
          href={trackerLink}
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
            color: sign === '+' ? '#2fccdc' : 'red',
          }}
        >
          {sign}
        </span>{' '}
        {amount} {tx.data.params._symbol ?? 'ICX'}
      </Typography>
    </RowContent>
  );
};

const TransactionTable = () => {
  const { page, setPage } = usePagination();
  const limit = 10;

  const { isLoading, data } = useQuery<Transaction[]>(['transactions', page], () =>
    getLoanTransation({
      skip: page * limit,
      limit,
    }),
  );

  const { data: totalTx = 0 } = useQuery<number>('totalTransaction', async () => {
    const result = await getTotalTransactions();
    return result.loans_transactions;
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
