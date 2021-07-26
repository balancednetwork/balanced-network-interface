import React from 'react';

import { BoxProps, Flex } from 'rebass/styled-components';

import { Typography } from 'app/theme';
import { MINIMUM_ICX_AMOUNT_IN_WALLET } from 'constants/index';

export default function CurrencyBalanceErrorMessage(props: BoxProps) {
  return (
    <Flex justifyContent="center" {...props}>
      <Typography maxWidth="320px" color="alert" textAlign="center">
        {`You need at least ${MINIMUM_ICX_AMOUNT_IN_WALLET} ICX in your wallet to complete this transaction.`}
      </Typography>
    </Flex>
  );
}
