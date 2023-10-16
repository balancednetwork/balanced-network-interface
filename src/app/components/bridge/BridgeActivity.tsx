import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { XCallActivityItem } from 'app/_xcall/types';
import { Typography } from 'app/theme';
import { useXCallActivityItems, useXCallState } from 'store/xCall/hooks';

import XCallItem from './XCallItem';

const MemoizedItem = React.memo(XCallItem);

export default function BridgeActivity() {
  const { data: activityItems } = useXCallActivityItems();
  const xcallState = useXCallState();
  console.log('🚀 ~ file: BridgeActivity.tsx:17 ~ BridgeActivity ~ xcallState:', xcallState);

  return (
    <Box bg="bg2" flex={1} p={['25px', '35px']}>
      <Flex mb={5} flexWrap="wrap">
        <Typography variant="h2" mb={2}>
          <Trans>Activity</Trans>
        </Typography>
      </Flex>
      <Box className="border-top" py={4}>
        {activityItems?.map((item: XCallActivityItem) => (
          <MemoizedItem key={item.originData.sn} {...item} />
        ))}
      </Box>
    </Box>
  );
}
