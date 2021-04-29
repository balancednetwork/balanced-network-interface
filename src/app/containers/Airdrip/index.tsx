import React from 'react';

import axios from 'axios';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { Typography } from 'app/theme';
import AirdripImg from 'assets/images/airdrip.png';
import { useWalletModalToggle } from 'store/application/hooks';
import { shortenAddress } from 'utils';

import 'styles/airdrip.css';

const Container = styled(Box)`
  /* disable margin collapse */
  display: flex;
  flex-direction: column;
  max-width: 1280px;
  min-height: 100vh;
  margin-left: auto;
  margin-right: auto;
  padding-left: 40px;
  padding-right: 40px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding-left: 16px;
    padding-right: 16px;
  `}
`;

const StyledHeader = styled(Box)`
  margin-top: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    margin-top: 25px;
    margin-bottom: 25px;
  `}
`;

const Gradient = styled.span`
  background: -webkit-linear-gradient(120deg, #2ca9b7, #1b648f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
`;

const Separator = styled.h1`
  margin-top: 15px;
  margin-bottom: 0px;
  font-size: 60px;
  line-height: 1.33;
  text-align: center;

  ::after {
    content: '';
    display: block;
    margin-top: 20px;
    margin-bottom: 15px;
    width: 125px;
    height: 5px;
    border-radius: 2px;
    background-image: linear-gradient(120deg, #2ca9b7, #1b648f);
    margin-left: auto;
    margin-right: auto;
  }
`;

export function Airdrip() {
  const toggleWalletModal = useWalletModalToggle();
  const { account } = useIconReact();

  const [hasClaimed, setHasClaimed] = React.useState(false);

  const handleClaim = () => {
    setHasClaimed(!hasClaimed);
  };

  const below600 = useMedia('(max-width: 600px)');

  React.useEffect(() => {
    const fetchStatus = async () => {
      const res = await axios.get(`https://stage.airdrip.co/api/v1/claim-detail?address=${account}`);
      console.log(res);
    };

    if (account) fetchStatus();
  }, [account]);

  return (
    <Container>
      <Helmet>
        <title>Airdrip</title>
      </Helmet>

      <StyledHeader>
        <Flex alignItems="center" justifyContent="space-between">
          <Logo />

          <Button as="a" href="/">
            Go to app
          </Button>
        </Flex>
      </StyledHeader>

      <Flex flexDirection="column" mx="auto" alignItems="center" width="fit-content" mb={50}>
        <img src={AirdripImg} width="175px" alt="" />
        <Separator>
          Air<Gradient>drip</Gradient>
        </Separator>
        <Typography variant="p" fontSize={22} maxWidth="285px" textAlign="center">
          Earn Balance Tokens every week you stake ICX.
        </Typography>
      </Flex>

      <Box
        bg="bg3"
        maxWidth={700}
        mx="auto"
        css={`
          border-radius: 10px;
        `}
        mb={10}
        width="100%"
      >
        <Flex alignItems="center" flexDirection={['column', 'row']}>
          <Flex
            flex={1}
            flexDirection="column"
            alignItems="center"
            className={below600 ? 'border-bottom' : 'border-right'}
            py={['25px', '35px']}
          >
            <Typography variant="h3" fontWeight="bold">
              15,000 / 70,000{' '}
              <Typography fontSize="16px" lineHeight="25px" as="span" color="rgba(255,255,255,0.75)">
                BALN
              </Typography>
            </Typography>
            <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)" mb={3}>
              Claimed this week
            </Typography>
            <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)">
              This drip dries up on
            </Typography>
            <Typography variant="p" fontWeight="bold">
              Sunday, 9 May
            </Typography>
          </Flex>

          <Flex flex={1} flexDirection="column" alignItems="center" py={['25px', '35px']}>
            {!account && (
              <>
                <Button onClick={toggleWalletModal}>Sign in to claim</Button>
              </>
            )}

            {account && !hasClaimed && (
              <>
                <Typography
                  variant="p"
                  fontSize="18px"
                  lineHeight="35px"
                  color="rgba(255,255,255,0.75)"
                  textAlign="center"
                >
                  Wallet: {shortenAddress(account)}
                </Typography>
                <Typography variant="p" fontSize="18px" fontWeight="bold">
                  25 BALN
                </Typography>
                <Button mt={5} onClick={handleClaim}>
                  Claim airdrip
                </Button>
              </>
            )}

            {account && hasClaimed && (
              <>
                <Typography
                  variant="p"
                  fontSize="18px"
                  lineHeight="35px"
                  color="rgba(255,255,255,0.75)"
                  textAlign="center"
                >
                  Wallet: {shortenAddress(account)}
                </Typography>
                <Typography variant="p" fontSize="18px" fontWeight="bold">
                  Airdrip claimed
                </Typography>
                <Button mt={5} onClick={handleClaim}>
                  Check another wallet
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Drip background */}
      <div id="hero-background">
        <div id="drip-1" className="drip" />
        <div id="drip-2" className="drip" />
        <div id="drip-3" className="drip" />
        <div id="drip-4" className="drip" />
        <div id="drip-5" className="drip" />
        <div id="drip-6" className="drip" />
        <div id="drip-7" className="drip" />
        <div id="drip-8" className="drip" />
        <div id="drip-9" className="drip" />
        <div id="drip-10" className="drip" />
        <div id="drip-11" className="drip" />
        <div id="drip-12" className="drip" />
      </div>
    </Container>
  );
}
