import React from 'react';

import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import AppBar from 'app/components/AppBar';
import Header from 'app/components/Header';

const StyledHeader = styled(Header)`
  margin-top: 25px;
  margin-bottom: 25px;

  ${({ theme }) => theme.mediaWidth.upMedium`
    margin-top: 50px;
    margin-bottom: 50px;
  `}
`;

export const Container = styled(Box)`
  /* disable margin collapse */
  display: flex;
  flex-direction: column;
  max-width: 1280px;
  min-height: 100vh;
  margin-left: auto;
  margin-right: auto;
  padding-left: 16px;
  padding-right: 16px;

  ${({ theme }) => theme.mediaWidth.upMedium`
    padding-left: 40px;
    padding-right: 40px;
  `}
`;

const DesktopAppBarWrapper = styled(Box)`
  z-index: ${({ theme }) => theme.zIndices.appBar};
  margin-right: 75px;
`;

const MobileAppBarWrapper = styled(Box)`
  z-index: ${({ theme }) => theme.zIndices.appBar};
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: fit-content;
  position: sticky;
  margin-top: 48px;
  bottom: 24px;
  ul {
    box-shadow: 0 2.8px 2.2px rgba(0, 0, 0, 0.068), 0 6.7px 5.3px rgba(0, 0, 0, 0.096),
      0 12.5px 10px rgba(0, 0, 0, 0.12), 0 22.3px 17.9px rgba(0, 0, 0, 0.144), 0 41.8px 33.4px rgba(0, 0, 0, 0.172),
      0 100px 80px rgba(0, 0, 0, 0.24);
  }
`;

export const DefaultLayout: React.FC<{ title?: string }> = props => {
  const { children, title = 'Home' } = props;
  const upLarge = useMedia('(min-width: 1200px)');

  return (
    <>
      <Container>
        <StyledHeader title={title} />

        <Flex flex={[1, 1, 1, 1, 'initial']}>
          {upLarge && (
            <DesktopAppBarWrapper>
              <AppBar />
            </DesktopAppBarWrapper>
          )}

          {children}
        </Flex>

        {!upLarge && (
          <MobileAppBarWrapper>
            <AppBar />
          </MobileAppBarWrapper>
        )}
      </Container>
    </>
  );
};
