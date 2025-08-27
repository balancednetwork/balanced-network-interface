import { Typography } from '@/app/theme';
import { useCombinedTransactions } from '@/hooks/useCombinedTransactions';
import React from 'react';
import styled from 'styled-components';
import HistoryItem from './HistoryItem';

const Wrap = styled.div`
  padding: 25px 0;
  width: 400px;
  max-width: calc(100vw - 4px);
  ul {
    max-height: 500px;
    overflow-y: auto;
    list-style: none;
    padding: 0 25px;
    margin: 0;
  }
`;

const ListItem = styled.li`
  padding: 20px 0;
  display: block;
  border-bottom: 1px solid ${({ theme }) => theme.colors.divider};
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

const RecentActivity: React.FC = React.memo(() => {
  const transactions = useCombinedTransactions();

  return (
    <Wrap>
      <Typography variant="h2" px="25px">
        Recent activity
      </Typography>
      {transactions.length === 0 ? (
        <Typography px="25px" mt="15px">
          No recent trades to display.
        </Typography>
      ) : (
        <ul>
          {transactions.map(transaction => (
            <ListItem key={transaction.hash}>
              <HistoryItem tx={transaction} />
            </ListItem>
          ))}
        </ul>
      )}
    </Wrap>
  );
});

export default RecentActivity;
