import React from 'react';

import ClickAwayListener from 'react-click-away-listener';
import { Flex, Box, Link } from 'rebass/styled-components';
import styled from 'styled-components';

import Logo from '@/assets/icons/logo.svg';
import { Button } from '@/components/Button';
import AnimatedLink from '@/components/Button/AnimatedLink';
import OutlineButton from '@/components/Button/OutlineButton';
import { LINKS } from '@/constants/links';
import useBoolean from '@/hooks/useBoolean';

import BurgerMenu from './Burger';

const DesktopMenu = styled(Flex)`
  display: flex;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`;

const BurgerMenuContainer = styled(Flex)`
  display: none;
  position: relative;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: flex;
  `}
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 2fr;
  margin: 50px 0;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin: 25px 0;
  `}
`;

const Header = () => {
  const { toggle, state } = useBoolean();

  const handleClose = e => {
    if (!e.target.closest('#menu-burger') && e.target !== document.getElementById('menu-button')) {
      state && toggle();
    }
  };

  return (
    <Grid>
      <Flex>
        <Box width={[80, 85, 100]}>
          <Link href="https://balanced.network/">
            <Logo width="100%" />
          </Link>
        </Box>
      </Flex>
      <DesktopMenu sx={{ a: { marginLeft: 25 } }} alignItems="center" justifyContent="flex-end">
        <AnimatedLink as="a" href={LINKS.howitworks}>
          How-to
        </AnimatedLink>
        <AnimatedLink as="a" href={LINKS.stats} active={true}>
          Stats
        </AnimatedLink>
        <AnimatedLink as="a" href={LINKS.blog}>
          Blog
        </AnimatedLink>
        <AnimatedLink as="a" href={LINKS.forum}>
          Forum
        </AnimatedLink>
        <Button
          style={{ marginLeft: 25, fontSize: 16, padding: '3px 20px', lineHeight: '35px' }}
          as="a"
          href={LINKS.app}
        >
          Go to app
        </Button>
      </DesktopMenu>

      <BurgerMenuContainer alignItems="center" justifyContent="flex-end">
        <OutlineButton className={state ? 'active' : ''} onClick={toggle} id="menu-button">
          Menu
        </OutlineButton>
        <ClickAwayListener onClickAway={e => handleClose(e)}>
          <BurgerMenu show={state} />
        </ClickAwayListener>
      </BurgerMenuContainer>
    </Grid>
  );
};

export default Header;
