import React from 'react';

import { Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from '@/components/Button';
import AnimatedLink from '@/components/Button/AnimatedLink';
import { LINKS } from '@/constants/links';

const Container = styled(Box)<{ show: boolean }>`
  position: absolute;
  width: 240px;
  border-radius: 20px;
  display: ${({ show }) => (show ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: center;
  align-items: center;
  top: 65px;
  right: 0;
  padding: 25px;
  background-color: #0c2a4d;
  transform: translateX(0);
  z-index: 1;
  transition: opacity 0.6s ease;
  border: 2px solid #2ca9b7;
  box-shadow: 0 2.8px 2.2px rgb(0 0 0 / 3%), 0 6.7px 5.3px rgb(0 0 0 / 5%), 0 12.5px 10px rgb(0 0 0 / 6%),
    0 22.3px 17.9px rgb(0 0 0 / 7%), 0 41.8px 33.4px rgb(0 0 0 / 9%), 0 100px 80px rgb(0 0 0 / 12%);

  &:after {
    content: '';
    position: absolute;
    left: 50%;
    top: initial;
    bottom: -24px;
    border: solid transparent;
    height: 0;
    width: 0;
    pointer-events: none;
    border-color: transparent;
    border-top-color: #2ca9b7;
    transform: initial;
    border-width: 12px;
    margin-left: -12px;
    left: 90%;
    top: -25px;
    border-bottom-color: #2ca9b7;
    border-top-color: transparent;
  }
`;

const AnimatedLinkMobile = styled(AnimatedLink)`
  margin-bottom: 15px;
  margin-left: 0;
  font-size: 14px;
  &:after {
    margin: auto;
  }
  &:hover {
    &:after {
    }
  }
`;

const BurgerMenu = ({ show }: { show: boolean }) => {
  return (
    <Container show={show} id="menu-burger">
      <AnimatedLinkMobile as="a" href={LINKS.howitworks}>
        How-to
      </AnimatedLinkMobile>
      <AnimatedLinkMobile as="a" href={LINKS.stats}>
        Stats
      </AnimatedLinkMobile>
      <AnimatedLinkMobile as="a" href={LINKS.blog}>
        Blog
      </AnimatedLinkMobile>
      <AnimatedLinkMobile as="a" href={LINKS.forum}>
        Forum
      </AnimatedLinkMobile>
      <Button
        style={{ textAlign: 'center', width: '100%', padding: '3px 20px', lineHeight: '35px' }}
        as="a"
        href={LINKS.app}
      >
        Go to app
      </Button>
    </Container>
  );
};

export default BurgerMenu;
