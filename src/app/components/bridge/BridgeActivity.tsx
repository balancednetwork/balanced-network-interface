import React from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';

export default function BridgeActivity() {
  return (
    <Box bg="bg2" flex={1} p={['25px', '35px']}>
      <Flex mb={5} flexWrap="wrap">
        <Typography variant="h2" mb={2}>
          <Trans>Activity</Trans>
        </Typography>
      </Flex>
    </Box>
  );
}
