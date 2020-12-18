import React from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { AppBar } from 'app/components/AppBar';
import { Header } from 'app/components/Header';

const StyledHeader = styled(Header)`
  margin-top: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-top: 25px;
    margin-bottom: 25px;
  `}
`;

const Container = styled(Box)`
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 40px;
  padding-right: 40px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-left: 16px;
    padding-right: 16px;
  `}
`;

const DesktopAppBarWrapper = styled(Box)`
  margin-right: 75px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
    margin-right: 0;
  `}
`;

const MobileAppBarWrapper = styled(Box)`
  display: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
    margin-left: auto;
    margin-right: auto;
    width: fit-content;
    position: sticky;
    margin-top: 48px;
    bottom: 24px;
  `}
`;

export function DefaultLayout(props) {
  const { children } = props;

  return (
    <>
      <Container>
        <StyledHeader title="Home" />

        <Flex>
          <DesktopAppBarWrapper>
            <AppBar />
          </DesktopAppBarWrapper>

          {children}
        </Flex>

        <MobileAppBarWrapper>
          <AppBar />
        </MobileAppBarWrapper>
      </Container>
    </>
  );
}
