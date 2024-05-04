import React from 'react';

import { Trans } from '@lingui/macro';

import { Typography } from 'app/theme';
import { MessagingProtocol } from 'app/pages/trade/bridge-v2/types';

export const XCallDescription = ({ protocol }: { protocol: MessagingProtocol }) => {
  return (
    <>
      <Typography mb={3}>
        <Trans>
          <strong>{protocol.name}</strong> {protocol.description}.
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
