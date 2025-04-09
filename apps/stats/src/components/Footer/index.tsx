import React from 'react';

import { Box, Flex, Link, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import Coingecko from '@/assets/icons/coingecko-white.svg';
import CoinMarketCap from '@/assets/icons/coinmarketcap.svg';
import Discord from '@/assets/icons/discord.svg';
import GitHub from '@/assets/icons/github.svg';
import Logo from '@/assets/icons/logo.svg';
import Reddit from '@/assets/icons/reddit.svg';
import Twitter from '@/assets/icons/twitter.svg';
import { Button } from '@/components/Button';
import AnimatedLink from '@/components/Button/AnimatedLink';
import SocialButton from '@/components/Button/SocialButton';
import { LINKS, SOCIAL_LINKS } from '@/constants/links';

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: auto 1fr;
  margin: 50px 0;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 25px 0 ;
    grid-template-columns: none;
    grid-template-rows: auto 1fr;
    justify-content: center;

  `}

  .footer-right-menu {
    a:not(.top-right-menu-item),
    button {
      margin: 0;
      margin-left: 25px;
      ${({ theme }) => theme.mediaWidth.upToSmall`
        margin-left: 0;
        margin-bottom: 3px;
      `}
    }
  }

  &.footer-social {
    ${({ theme }) => theme.mediaWidth.upToSmall`
      flex-direction: column-reverse;
    `}
  }
`;

const StyledFlex = styled(Flex)`
  margin-bottom: 20px;
  align-items: center;

  a {
    margin: 0 0 -9px 25px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-bottom: 10px;
    a {
      margin: 0 0 3px 0;
    }
  `}
`;

const FooterLogo = styled(Flex)`
  margin-bottom: 0;
  justify-content: flex-start;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-bottom: 15px;
    justify-content: center;
  `}
`;

const FooterNav = styled(Flex)`
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-bottom: 15px;
    justify-content: center;
    align-items: center;
  `}
`;

const FooterNavTop = styled(StyledFlex)`
  flex-direction: row;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`;

const FooterNavBottom = styled(Flex)`
  align-items: center;
  flex-direction: row;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `}
`;

const FooterSocials = styled(Flex)`
  padding-bottom: 40px;
  flex-direction: row;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column-reverse;
  `}
`;

const SocialsList = styled(Flex)`
  justify-content: flex-end;
  margin-left: auto;
  margin-right: -9px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-content: center;
    margin: 0 0 15px 0; 
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-wrap: wrap;
  `}

  a {
    margin: 0 9px;
  }
`;

const FooterSubNav = styled(Flex)`
  align-items: flex-start;
  flex-direction: column;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: left;
    align-items: center;
  `}
`;

const Divider = styled.span`
  margin: 0 8px;
  color: ${({ theme }) => theme.text1};
`;

const Footer = () => {
  return (
    <>
      <Grid>
        <FooterLogo>
          <Box width="100px">
            <Link href="https://balanced.network/">
              <Logo width="100%" />
            </Link>
          </Box>
        </FooterLogo>
        <FooterNav className="footer-right-menu">
          <FooterNavTop>
            <AnimatedLink className="top-right-menu-item" as="a" href={LINKS.howitworks}>
              How-to
            </AnimatedLink>
            <AnimatedLink className="top-right-menu-item" as="a" href={LINKS.demo}>
              Demo
            </AnimatedLink>
            <AnimatedLink className="top-right-menu-item" as="a" href={LINKS.stats} active={true}>
              Stats
            </AnimatedLink>
            <AnimatedLink className="top-right-menu-item" as="a" href={LINKS.blog}>
              Blog
            </AnimatedLink>
            <AnimatedLink className="top-right-menu-item" as="a" href={LINKS.forum}>
              Forum
            </AnimatedLink>
            <Button style={{ fontSize: 16, padding: '3px 20px', lineHeight: '35px' }} as="a" href={LINKS.app}>
              Go to app
            </Button>
          </FooterNavTop>
          <FooterNavBottom>
            <AnimatedLink as="a" href={LINKS.docs}>
              Docs
            </AnimatedLink>
            <AnimatedLink as="a" href={LINKS.stablecoin}>
              Stablecoin
            </AnimatedLink>
            <AnimatedLink as="a" href={LINKS.reviews}>
              Reviews
            </AnimatedLink>
            <AnimatedLink as="a" href={LINKS.nfts}>
              NFTs
            </AnimatedLink>
          </FooterNavBottom>
        </FooterNav>
      </Grid>
      <FooterSocials className="footer-social">
        <FooterSubNav>
          <Text>{`© Balanced ${new Date().getFullYear()}. All rights reserved.`}</Text>
          <Flex alignItems="center">
            <AnimatedLink style={{ marginLeft: 0, display: 'inline-block' }} as="a" href={LINKS.disclamer}>
              Disclaimer
            </AnimatedLink>
            <Divider>|</Divider>
            <AnimatedLink style={{ marginLeft: 0, display: 'inline-block' }} as="a" href={LINKS.privacyPolicy}>
              Privacy policy
            </AnimatedLink>
            <Divider>|</Divider>
            <AnimatedLink style={{ marginLeft: 0, display: 'inline-block' }} as="a" href={LINKS.brand}>
              Brand
            </AnimatedLink>
          </Flex>
        </FooterSubNav>
        <SocialsList>
          <SocialButton as="a" href={SOCIAL_LINKS.twitter}>
            <Twitter height={16} />
          </SocialButton>
          <SocialButton as="a" href={SOCIAL_LINKS.discord}>
            <Discord height={16} />
          </SocialButton>
          <SocialButton as="a" href={SOCIAL_LINKS.reddit}>
            <Reddit height={18} />
          </SocialButton>
          <SocialButton as="a" href={LINKS.github}>
            <GitHub height={22} />
          </SocialButton>
          <SocialButton as="a" href={LINKS.coingecko}>
            <Coingecko height={22} />
          </SocialButton>
          <SocialButton as="a" href={LINKS.coinmarketcap}>
            <CoinMarketCap height={22} />
          </SocialButton>
        </SocialsList>
      </FooterSocials>
    </>
  );
};

export default Footer;
