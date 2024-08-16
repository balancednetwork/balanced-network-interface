import { BoxPanel } from '@/components/Panel';
import React from 'react';
import { Box, Flex } from 'rebass';
import NetworkOwnedLiquidity from './NetworkOwnedLiquidity';
import ICXBurn from './ICXBurn';
import { Typography } from '@/theme';
import QuestionHelper, { QuestionWrapper } from '@/components/QuestionHelper';
import { UnderlineText } from '@/components/DropdownText';
import styled from 'styled-components';
import ClickAwayListener from 'react-click-away-listener';
import { useMedia } from 'react-use';

export const EnshrinementTooltipContent = () => (
  <>
    <Typography mb={3}>
      Balanced is economically enshrined by the ICON Network. ICON uses blockchain emissions to provide incentives and
      network-owned liquidity, and in return, Balanced uses 50% of its revenue to buy and burn ICX.
    </Typography>
    <StyledUnderlineText>
      <a href="https://blog.balanced.network/economic-enshrinement/" target="_blank" rel="noreferrer">
        Learn more about the economic enshrinement.
      </a>
    </StyledUnderlineText>
  </>
);

const StyledUnderlineText = styled(UnderlineText)`
  color: ${({ theme }) => theme.colors.primaryBright};
  a {
    color: inherit;
    text-decoration: none;
    outline: none;

    &:hover,
    &:focus,
    &:link,
    &:visited {
      text-decoration: none;
      outline: none;
      color: inherit;
    }
  }
`;

const EnshrinementSection = () => {
  const [show, setShow] = React.useState(false);
  const isSmall = useMedia('(max-width: 1199px)');

  return (
    <BoxPanel bg="bg2" id="enshrinement">
      <Flex mb="25px">
        <Typography variant="h2" mr="5px">
          ICON enshrinement
        </Typography>
        <ClickAwayListener onClickAway={() => setShow(false)}>
          <QuestionWrapper
            style={{ transform: 'translateY(4px)' }}
            onMouseEnter={() => setShow(true)}
            onTouchStart={() => setShow(true)}
          >
            <QuestionHelper width={370} defaultShow={show} text={<EnshrinementTooltipContent />} />
          </QuestionWrapper>
        </ClickAwayListener>
      </Flex>
      <Flex flexWrap="wrap">
        <Box
          width={isSmall ? '100%' : '50%'}
          className={isSmall ? '' : 'border-right'}
          p={isSmall ? '0' : '0 35px 0 0'}
        >
          <NetworkOwnedLiquidity />
        </Box>
        <Box width={isSmall ? '100%' : '50%'} p={isSmall ? '35px 0 0 0' : '0 0 0 35px'}>
          <ICXBurn />
        </Box>
      </Flex>
    </BoxPanel>
  );
};

export default EnshrinementSection;
