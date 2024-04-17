import React from 'react';

import { t } from '@lingui/macro';
import { BoxProps, Flex } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { MINIMUM_ICX_FOR_TX } from 'constants/index';

export default function CurrencyBalanceErrorMessage(props: BoxProps) {
  return (
    <Flex justifyContent="center" {...props}>
      <Typography maxWidth="320px" color="alert" textAlign="center">
        {t`You need at least ${MINIMUM_ICX_FOR_TX} ICX in your wallet to complete this transaction.`}
      </Typography>
    </Flex>
  );
}
