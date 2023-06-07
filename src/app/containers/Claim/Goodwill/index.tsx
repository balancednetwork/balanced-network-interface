import React from 'react';

import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from 'react-query';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import { Link } from 'app/components/Link';
import Logo from 'app/components/Logo';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useWalletModalToggle } from 'store/application/hooks';
import { useAllTransactions, useTransactionAdder } from 'store/transactions/hooks';
import { shortenAddress } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import 'styles/airdrip.css';

const Container = styled(Box)`
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

const StyledHeader = styled(Box)`
  margin-top: 25px;
  margin-bottom: 25px;
  ${({ theme }) => theme.mediaWidth.upMedium`
    margin-top: 50px;
    margin-bottom: 50px;
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

const useClaimableAmountQuery = () => {
  const { account } = useIconReact();
  const txs = useAllTransactions();

  return useQuery(
    ['claimableAmount', account, txs],
    async () => {
      const result = await bnJs.LiquidationDisbursement.getDisbursementDetail(account ?? '');
      return result['claimableTokens']['cx2609b924e33ef00b648a409245c7ea394c467824'];
    },
    {
      enabled: !!account,
    },
  );
};

export function ClaimGoodwill() {
  const toggleWalletModal = useWalletModalToggle();
  const { account } = useIconReact();

  const addTransaction = useTransactionAdder();

  const handleClaim = async () => {
    if (account) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      try {
        const res = await bnJs.inject({ account }).LiquidationDisbursement.claim();
        addTransaction(
          { hash: res.result },
          {
            pending: 'Claiming sICX...',
            summary: `sICX claimed.`,
          },
        );
      } catch (e) {
        console.error(e);
      } finally {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  const claimableAmountQuery = useClaimableAmountQuery();
  const hasClaimed = claimableAmountQuery.isSuccess && claimableAmountQuery.data === '0x0';

  return (
    <Container>
      <Helmet>
        <title>Claim</title>
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
        <Separator>
          <Gradient>Goodwill</Gradient> disbursement
        </Separator>
        <Typography variant="p" fontSize={20} maxWidth="500px" textAlign="center" color="text1">
          If you were a borrower on Balanced between January 20–24 2022, you’re eligible to claim sICX as a gesture of
          goodwill.{' '}
          <Link
            fontSize="20px"
            href="https://gov.balanced.network/t/emergency-fund-goodwill-blackswan-event-refine-proposal/759/141"
            target="_blank"
          >
            View proposal details.
          </Link>
        </Typography>
      </Flex>

      <Box
        bg="bg3"
        maxWidth={350}
        mx="auto"
        css={`
          border-radius: 10px;
        `}
        mb={10}
        width="100%"
      >
        <Flex flexDirection="column" alignItems="center" py={['25px', '35px']}>
          {!account && (
            <>
              <Button onClick={toggleWalletModal}>Sign in to claim</Button>
            </>
          )}

          {account && (
            <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)" textAlign="center">
              Wallet: {shortenAddress(account)}
            </Typography>
          )}

          {account && claimableAmountQuery.status === 'success' && !hasClaimed && (
            <>
              <Typography variant="p" fontSize="16px" fontWeight="bold">
                {new BigNumber(claimableAmountQuery.data).div(new BigNumber(10).pow(18)).toFixed(2)} sICX
              </Typography>
              <Button mt={5} onClick={handleClaim}>
                Claim sICX
              </Button>
            </>
          )}

          {account && claimableAmountQuery.status === 'loading' && <Spinner />}
          {account && claimableAmountQuery.status === 'success' && hasClaimed && (
            <>
              <Typography variant="p" fontSize="16px" fontWeight="bold">
                No sICX to claim
              </Typography>
              <Button mt={5} onClick={toggleWalletModal}>
                Check another wallet
              </Button>
            </>
          )}
        </Flex>
      </Box>
    </Container>
  );
}
