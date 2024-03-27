import React from 'react';

import { t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { UnderlineText } from 'app/components/DropdownText';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useRebalancingStatusQuery } from 'queries/rebalancing';
import { useWalletModalToggle } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

export default function RebalanceButton() {
  const { data: isAvailableToRebalance } = useRebalancingStatusQuery();

  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const handleRebalanceConfirm = async () => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      try {
        const res = await bnJs.inject({ account }).Rebalancing.rebalance();
        addTransaction(
          { hash: res.result },
          {
            pending: t`Rebalancing the bnUSD price...`,
            summary: t`Rebalancing complete.`,
          },
        );
      } catch (e) {
        console.error(e);
      } finally {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  const toggleWalletModal = useWalletModalToggle();
  const handleRebalance = () => {
    if (!account) {
      toggleWalletModal();
    } else {
      handleRebalanceConfirm();
    }
  };

  return (
    <Flex hidden={!isAvailableToRebalance}>
      <StyledUnderlineText onClick={handleRebalance}>Rebalance the bnUSD price</StyledUnderlineText>
      <QuestionHelper
        text={
          <Box>
            <Typography>
              bnUSD is too far from $1, which impacts exchange rates. Activate the rebalancing process to bring the
              price back.
            </Typography>
            <br />
            <Typography>You may need to do this multiple times.</Typography>
          </Box>
        }
        placement="top-end"
        containerStyle={{ width: 330 }}
      />
    </Flex>
  );
}

const StyledUnderlineText = styled(UnderlineText)`
  color: ${({ theme }) => theme.colors.primaryBright};
  font-size: 14px;
  text-decoration: none;
`;
