import React from 'react';

import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import AppBar from 'app/components/AppBar';
import Header from 'app/components/Header';

const StyledHeader = styled(Header)`
  margin-top: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-top: 25px;
    margin-bottom: 25px;
  `}
`;

const Container = styled(Box)`
  /* disable margin collapse */
  display: flex;
  flex-direction: column;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 40px;
  padding-right: 40px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
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
`;

export const DefaultLayout: React.FC<{ title?: string }> = props => {
  const { children, title = 'Home' } = props;
  const below1000 = useMedia('(max-width: 1000px)');

  return (
    <>
      <Container>
        <StyledHeader title={title} />

        <Flex>
          {!below1000 && (
            <DesktopAppBarWrapper>
              <AppBar />
            </DesktopAppBarWrapper>
          )}

          {children}
        </Flex>

        {below1000 && (
          <MobileAppBarWrapper>
            <AppBar />
          </MobileAppBarWrapper>
        )}
      </Container>
    </>
  );
};
