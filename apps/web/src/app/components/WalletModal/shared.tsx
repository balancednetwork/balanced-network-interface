import styled from 'styled-components';
import { Flex, Box, Text } from 'rebass/styled-components';

export const ChainIcons = styled.div``;
export const WalletIcons = styled.div``;

export const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  cursor: pointer;
  padding: 10px 20px;
  margin: 10px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  width: 130px;
  max-width: 125px;

  ${ChainIcons}, ${WalletIcons} {
    position: absolute;
    right: 5px;
    bottom: 38px;
    display: flex;
    flex-flow: column;
    opacity: 0.6;

    > * {
      margin-top: 7px;
    }

    img {
      width: 15px;
      height: 15px;
    }
  }

  ${({ theme }) => theme.mediaWidth.up420`
    max-width: 130px;
  `};

  > *:first-child {
    margin-bottom: 10px;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

export const UnbreakableText = styled(Text)`
  white-space: nowrap;
`;
