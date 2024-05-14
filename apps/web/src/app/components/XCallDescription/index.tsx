import React from 'react';

import { Trans } from '@lingui/macro';

import { Typography } from 'app/theme';
import { MessagingProtocol } from 'app/pages/trade/bridge/types';

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
          <strong>GMP</strong> (general message passing) is a cross-chain messenger that interacts with smart contracts
          on supported chains.
        </Trans>
      </Typography>
    </>
  );
};
