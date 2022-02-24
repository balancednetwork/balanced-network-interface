import React from 'react';

import { Typography } from 'app/theme';

import { Link } from './components/Link';

export const Message = () => (
  <>
    <Typography as="span">
      Balanced now distributes Balance Tokens as you earn them, instead of once every 24 hours.{' '}
      <Typography as="span" fontWeight="bold" color="white">
        Liquidity providers won't earn BALN{' '}
      </Typography>
      from incentivized pools until they stake their LP tokens from the liquidity details section.{' '}
    </Typography>
    <Link href="https://docs.balanced.network/user-guide/supply-liquidity" noBorder>
      Learn more in the docs.
    </Link>
  </>
);

export default Message;
