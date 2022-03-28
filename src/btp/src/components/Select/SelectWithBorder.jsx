import React from 'react';

import { Select } from 'btp/src/components/Select';
import { colors } from 'btp/src/components/Styles/Colors';
import { Text } from 'btp/src/components/Typography';
import styled from 'styled-components/macro';

const StyledSelect = styled(Select)`
  width: ${({ width }) => width || '256px'};
  height: 44px;

  margin-top: 8px;
  justify-content: space-between;
  border: 1px solid ${colors.grayLine};
  padding: 10px 16px;
  background-color: transparent !important;

  img {
    width: 24px;
  }

  ul {
    width: 90%;
  }
`;

const SelectWithBorder = ({ width, label, ...props }) => {
  return (
    <div>
      <Text className="sm">{label}</Text>
      <StyledSelect width={width} {...props} />
    </div>
  );
};
export default SelectWithBorder;
