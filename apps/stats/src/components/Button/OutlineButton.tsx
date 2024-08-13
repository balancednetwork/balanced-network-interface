import { Button } from 'rebass/styled-components';
import styled from 'styled-components';

const OutLineButton = styled(Button)`
  display: block;
  padding: 3px 12px;
  font-size: 14px;
  color: #ffffff;
  background-color: ${({ theme }) => theme.colors.bg2};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 5px;
  cursor: pointer;
  transition: border 0.2s ease, background-color 0.3s ease;
  &.active {
    background-color: ${({ theme }) => theme.colors.primary};
  }
`;

export default OutLineButton;
