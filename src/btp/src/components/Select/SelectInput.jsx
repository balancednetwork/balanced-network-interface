import { Select } from 'components/Select';
import { colors } from 'components/Styles/Colors';
import { Text } from 'components/Typography';
import styled from 'styled-components/macro';

import filledDownArrow from 'assets/images/filled-down-arrow.svg';

const StyledSelect = styled(Select)`
  width: 100%;
  height: 66px;
  justify-content: space-between;
  border: 1px solid ${({ hasError }) => (hasError ? colors.errorState : colors.grayLine)};
  padding: 20px 16px;
  background-color: transparent !important;

  &:after {
    width: 12px;
    height: 10px;
  }

  & > .plain-text.md {
    text-transform: uppercase;
  }

  ul {
    width: 100%;
    top: calc(100% - 20px);
  }
`;

export const SelectInput = ({ meta = {}, ...props }) => {
  const hasError = meta.error && meta.touched;

  return (
    <>
      <StyledSelect {...props} meta={meta} customeArrow={filledDownArrow} hasError={hasError} />
      {hasError && <Text className="xs err-msg">{meta.error}</Text>}
    </>
  );
};
