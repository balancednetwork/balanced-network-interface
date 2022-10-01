import React, { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';
import styled, { css } from 'styled-components';

import { ReactComponent as CrossIcon } from 'assets/icons/cross.svg';
import useLocalStorage from 'hooks/useLocalStorage';
import { PageLocation } from 'utils';

const BannerContainer = styled(motion(Box))<{ embedded?: boolean }>`
  margin: 0 0 25px;
  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    margin: 25px 16px 0;
  `}
  ${({ theme }) => theme.mediaWidth.upMedium`
   margin: 25px 40px 0;
  `}
  ${({ theme }) => theme.mediaWidth.upLarge`
   margin: 25px auto 0;
   max-width: 1280px;
   padding: 0 40px;
  `}

   ${({ embedded }) =>
    embedded &&
    css`
      margin: 15px 0;
      ${({ theme }) => theme.mediaWidth.upLarge`
        margin: 15px auto;
        max-width: 1280px;
        padding: 0;
      `}
    `};
`;

const BannerStyled = styled(Flex)<{ close?: boolean; embedded?: boolean }>`
  padding: 10px 15px;
  border-radius: 0 0 10px 10px;
  background: #0b284c;
  border: 2px solid #2ca9b7;
  line-height: 1.5;
  flex-direction: column;
  align-items: end;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 15px 25px;
    border-radius: 10px;
    background: #0b284c;
    border: 2px solid #2ca9b7;
    line-height: 1.7;
    flex-direction: row;
    align-items: center;
  `};

  ${({ embedded }) =>
    embedded &&
    css`
      border-radius: 10px;
    `};
`;

const IconButton = styled.button`
  flex-shrink: 1;
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 3px 0 0 0;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 0 0 0 6px;
    margin-left: 5px;
  `}
`;

enum BannerStatus {
  ACTIVE = '',
  CLOSED = 'closed',
}

export const Banner = ({
  children,
  messageID,
  location,
  embedded,
}: {
  children: ReactNode;
  messageID: string;
  location?: PageLocation;
  embedded?: boolean;
}) => {
  const [bannerClosed, setBannerClosed] = useLocalStorage(`banner_${messageID}`, BannerStatus.ACTIVE);
  const userLocation = useLocation();
  const shouldShow = !location || userLocation.pathname === location;

  const handleClose = (): void => {
    setBannerClosed(BannerStatus.CLOSED);
  };

  return (
    <AnimatePresence>
      {shouldShow && !bannerClosed && (
        <BannerContainer
          initial={{ y: 10 }}
          animate={{ y: 0, height: 'auto', transition: { type: 'spring', stiffness: 750 } }}
          exit={{ y: -30, opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
          embedded
        >
          <BannerStyled embedded>
            <Box flex="1">{children}</Box>
            <IconButton onClick={handleClose}>
              <CrossIcon width="25px" height="25px" />
            </IconButton>
          </BannerStyled>
        </BannerContainer>
      )}
    </AnimatePresence>
  );
};
