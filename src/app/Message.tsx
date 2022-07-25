import React from 'react';

import { Typography } from 'app/theme';

import { Link } from './components/Link';

export const Message = () => (
  <>
    <Typography as="span">
      Balanced now distributes network fees as you earn them, instead of once every 24 hours.{' '}
      <Typography as="span" fontWeight="bold" color="white">
        Unclaimed fees have not been migrated.{' '}
      </Typography>
      To check for and claim any outstanding fees, go to{' '}
    </Typography>
    <Link href="https://app.balanced.network/claim" noBorder>
      app.balanced.network/claim
    </Link>
    .
  </>
);

export default Message;
