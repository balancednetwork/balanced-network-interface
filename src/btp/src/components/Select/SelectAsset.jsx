import React from 'react';

import { Icon } from 'btp/src/components/Icon';
import { colors } from 'btp/src/components/Styles/Colors';
import { TextWithIcon } from 'btp/src/components/TextWithIcon';
import { Text } from 'btp/src/components/Typography';
import { getTokenOptions } from 'btp/src/utils/constants';
import styled from 'styled-components/macro';

import Select from './Select';

const StyledItem = styled.div`
  display: flex;
  align-items: center;
  min-width: 160px;

  & .icon {
    margin-right: 12px;
  }

  .plain-text.xs {
    color: ${colors.grayScaleSubText};
    margin-top: 4px;
  }
`;

const Item = ({ symbol, children, ...props }) => {
  return (
    <StyledItem>
      <Icon {...props} width="24px" />
      <div className="info">
        <Text className="md">{symbol}</Text>
        <Text className="xs">{children}</Text>
      </div>
    </StyledItem>
  );
};

const SelectAsset = ({ onChange, currentNetwork }) => {
  /* eslint-disable react/display-name */
  const options = getTokenOptions(currentNetwork).map(({ symbol, netWorkLabel }) => ({
    value: symbol,
    label: symbol,
    renderLabel: () => (
      <TextWithIcon icon={symbol} width="24px">
        {symbol}
      </TextWithIcon>
    ),
    renderItem: () => (
      <Item icon={symbol} symbol={symbol}>
        {netWorkLabel}
      </Item>
    ),
  }));

  return <Select options={options} onChange={onChange} name="token" />;
};

export default SelectAsset;
