import React from 'react';

import { Typography } from 'app/theme';

import CommunityListToggle from './components/CommunityListToggle';

export const Message = () => (
  <>
    <Typography as="span">
      Missing a liquidity pool? <CommunityListToggle /> to see details for all pools you've participated in.
    </Typography>
  </>
);

export default Message;
