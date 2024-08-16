import React, { useMemo } from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { BoxPanel, FlexPanel } from '@/app/components/Panel';

const PositionDetailPanel = () => {
  return <></>;
};

export default PositionDetailPanel;

export const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: initial;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 0;
  `}

  ${({ theme }) => theme.mediaWidth.upMedium`
    padding: 0;
    grid-column: span 2;
    flex-direction: row;
  `}
`;

export const MetaData = styled(Box)`
  font-size: 14px;
  margin-top: -10px;

  & dt {
    line-height: 17px;
  }

  & dd {
    margin-inline: 0px;
    color: rgba(255, 255, 255, 0.75);
    white-space: nowrap;
  }
`;
