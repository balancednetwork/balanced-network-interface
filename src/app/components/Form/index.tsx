import React from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { MouseoverTooltip } from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { Currency } from 'types';

export const CheckBox = styled(Box)<{ isActive: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background-color: ${props => (props.isActive ? props.theme.colors.primary : '#03334f')};
`;

export const Field: React.FC<{
  editable: boolean;
  isActive: boolean;
  label: string;
  value: string;
  currency: Currency;
  tooltipText: string;
}> = function (props) {
  const { isActive, label, value, currency, tooltipText } = props;

  return (
    <Flex flexDirection="column">
      <Flex alignItems="center">
        <MouseoverTooltip placement="top" text={tooltipText}>
          <Flex>
            <CheckBox isActive={isActive} mr="4px" />
            <Typography variant="p">{label}</Typography>
          </Flex>
        </MouseoverTooltip>
      </Flex>

      <Typography variant="p" ml={24} fontSize={18}>
        {`${value} ${currency.symbol}`}
      </Typography>
    </Flex>
  );
};
