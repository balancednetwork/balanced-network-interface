import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';
import { useXCallStats } from '../_hooks/useXCallStats';

import Spinner from '../../../../components/Spinner';
import ActivityBarChart from './ActivityBarChart';
import XTransactionHistoryItem from './XTransactionHistoryItem';
import { useXTransactionStore } from '../_zustand/useXTransactionStore';
import { useSignedInWallets } from '../_hooks/useWallets';
import { useXMessageStore, xMessageActions } from '../_zustand/useXMessageStore';
import { XMessageStatus } from '../_zustand/types';

export default function BridgeActivity() {
  const { data: xCallStats } = useXCallStats();
  const isSmall = useMedia('(max-width: 600px)');
  const isMedium = useMedia('(max-width: 1100px) and (min-width: 800px)');
  const signedInWallets = useSignedInWallets();

  useXMessageStore();
  const { getPendingTransactions } = useXTransactionStore();
  const pendingTransactions = getPendingTransactions(signedInWallets);

  const messageCount = useMemo(() => {
    return pendingTransactions.reduce((acc: number, x) => {
      const primaryMessage = xMessageActions.get(x.primaryMessageId);
      const secondMessage = x.secondaryMessageId && xMessageActions.get(x.secondaryMessageId);

      if (primaryMessage && primaryMessage.status !== XMessageStatus.CALL_EXECUTED) acc++;
      if (secondMessage && secondMessage.status !== XMessageStatus.CALL_EXECUTED) acc++;
      return acc;
    }, 0);
  }, [pendingTransactions]);
  return (
    <Box bg="bg2" flex={1} p={['25px', '35px']}>
      <Box mb="35px">
        <Typography variant="h2" mb={'38px'}>
          <Trans>Activity</Trans>
        </Typography>
        <Flex mt={4} flexWrap={isSmall || isMedium ? 'wrap' : 'nowrap'}>
          <Flex
            width={1}
            p={isSmall || isMedium ? '0 25px 15px' : '0 25px'}
            mb={isSmall || isMedium ? '15px' : '0'}
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            className={isSmall || isMedium ? 'border-bottom' : 'border-right'}
          >
            <Typography>
              <Trans>Cross-chain transactions (24H)</Trans>
            </Typography>
            <Typography color="text" fontSize={16} mt={2}>
              {xCallStats ? xCallStats.transactionCount : '...'}
            </Typography>
          </Flex>
          <Flex width={1} p="0 25px" flexDirection="column" justifyContent="center" alignItems="center">
            <Box alignSelf="stretch" height="100%" minHeight="52px">
              {xCallStats?.data ? (
                <ActivityBarChart data={xCallStats.data} />
              ) : (
                <Box alignSelf="stretch" className="FUK" style={{ position: 'relative', paddingTop: '50px' }}>
                  <Spinner $centered />
                </Box>
              )}
            </Box>
          </Flex>
        </Flex>
      </Box>
      <Box className="border-top" py={4}>
        <Box
          pr={messageCount >= 4 ? 2 : 0}
          style={messageCount >= 4 ? { overflowY: 'scroll', maxHeight: '180px' } : {}}
        >
          {messageCount > 0 &&
            pendingTransactions.map((x, index) => <XTransactionHistoryItem key={index} xTransaction={x} />)}
          {(messageCount === 0 || pendingTransactions?.length === 0) &&
            (signedInWallets.length ? (
              <Typography textAlign="center">
                <Trans>You have no pending cross-chain transactions.</Trans>
              </Typography>
            ) : (
              <Typography textAlign="center">
                <Trans>There are no pending cross-chain transactions.</Trans>
              </Typography>
            ))}
        </Box>
      </Box>
    </Box>
  );
}
