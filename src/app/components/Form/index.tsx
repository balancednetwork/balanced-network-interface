import React from 'react';

import { Text, Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { MouseoverTooltip } from 'app/components/Tooltip';

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
  value: number;
  unit: string;
  tooltipText: string;
}> = function (props) {
  const { isActive, label, value, unit, tooltipText } = props;

  return (
    <Flex flexDirection="column">
      <Flex alignItems="center">
        <MouseoverTooltip placement="top" text={tooltipText}>
          <Flex>
            <CheckBox isActive={isActive} mr="4px" />
            <Text color="rgba(255,255,255,0.75)" fontSize={16}>
              {label}
            </Text>
          </Flex>
        </MouseoverTooltip>
      </Flex>

      <Text ml={24} color="text" fontSize={18}>
        {`${value} ${unit}`}
      </Text>
    </Flex>
  );
};
