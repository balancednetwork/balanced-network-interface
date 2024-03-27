import React from 'react';

import { Trans } from '@lingui/macro';

import { Typography } from 'app/theme';

export const IBCDescription = () => {
  return (
    <>
      <Typography mb={3}>
        <Trans>
          <strong>IBC</strong> is the Cosmos interoperability protocol.
        </Trans>
      </Typography>
      <Typography>
        <Trans>
          <strong>xCall</strong> is a cross-chain messaging service that can interact with smart contracts on other
          blockchains.
        </Trans>
      </Typography>
    </>
  );
};
