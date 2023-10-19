import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { XCallActivityItem } from 'app/_xcall/types';
import { Typography } from 'app/theme';
import { useXCallActivityItems, useXCallState, useXCallStats } from 'store/xCall/hooks';

import XCallItem from './XCallItem';

const MemoizedItem = React.memo(XCallItem);

export default function BridgeActivity() {
  const { data: activityItems } = useXCallActivityItems();
  const { data: xCallStats } = useXCallStats();
  const xcallState = useXCallState();
  console.log('🚀 ~ file: BridgeActivity.tsx:17 ~ BridgeActivity ~ xcallState:', xcallState);

  return (
    <Box bg="bg2" flex={1} p={['25px', '35px']}>
      <Box mb="35px">
        <Typography variant="h2" mb={'38px'}>
          <Trans>Activity</Trans>
        </Typography>
        <Flex mt={4}>
          <Flex
            width={[1, 1 / 2]}
            p="0 25px"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            className="border-right"
          >
            <Typography>
              <Trans>Cross-chains transfer (24H)</Trans>
            </Typography>
            <Typography color="text" fontSize={16} mt={2}>
              {xCallStats ? xCallStats.transfers : '...'}
            </Typography>
          </Flex>
          <Flex width={[1, 1 / 2]} p="0 25px" flexDirection="column" justifyContent="center" alignItems="center">
            <Typography>
              <Trans>Cross-chains swaps (24H)</Trans>
            </Typography>
            <Typography color="text" fontSize={16} mt={2}>
              {xCallStats ? xCallStats.swaps : '...'}
            </Typography>
          </Flex>
        </Flex>
      </Box>
      <Box className="border-top" py={4}>
        {activityItems?.map((item: XCallActivityItem) => (
          <MemoizedItem key={item.originData.sn} {...item} />
        ))}
        {activityItems?.length === 0 && (
          <Typography textAlign="center">You have no pending or failed cross-chain transactions.</Typography>
        )}
      </Box>
    </Box>
  );
}
