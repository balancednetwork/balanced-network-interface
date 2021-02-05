import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

const Divider = styled(Box)`
  height: 1px;
  background-color: ${({ theme }) => theme.colors.divider};
`;

export default Divider;
