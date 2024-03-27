import React from 'react';

import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Logo from 'app/components/Logo';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { BATCH_SIZE, useUserCollectedFeesQuery } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign, useWalletModalToggle } from 'store/application/hooks';
import { useHasNetworkFees } from 'store/reward/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
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
  font-size: 40px;
  line-height: 1.33;
  text-align: center;

  ${({ theme }) => theme.mediaWidth.up360`
    font-size: 50px;
  `};

  ${({ theme }) => theme.mediaWidth.upMedium`
    font-size: 60px;
  `};

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

export function Claim() {
  const toggleWalletModal = useWalletModalToggle();
  const { account } = useIconReact();
  const [feeTx, setFeeTx] = React.useState('');
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();

  const handleFeeClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    const end = platformDay - feesIndex * BATCH_SIZE;
    const start = end - BATCH_SIZE > 0 ? end - BATCH_SIZE : 0;

    bnJs
      .inject({ account })
      .Dividends.claim(start, end)
      .then(res => {
        addTransaction(
          { hash: res.result }, //
          {
            summary: t`Claimed fees.`,
            pending: t`Claiming fees...`,
          },
        );
        setFeeTx(res.result);
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;

    setOpen(!open);
  };

  const feeTxStatus = useTransactionStatus(feeTx);

  const hasNetworkFees = useHasNetworkFees();
  const platformDay = 452;
  const { data: feesArr, refetch } = useUserCollectedFeesQuery(1, platformDay);
  const fees = feesArr?.find(fees => fees);
  const feesIndex = feesArr?.findIndex(fees => fees) || 0;
  const hasFee = !!fees;
  const count = feesArr?.reduce((c, v) => (v ? ++c : c), 0);
  React.useEffect(() => {
    if (feeTxStatus === TransactionStatus.success) refetch();
  }, [feeTxStatus, refetch]);

  const getNetworkFeesUI = () => {
    if (feesArr === undefined) {
      return <Spinner></Spinner>;
    }
    if (hasNetworkFees && !hasFee) {
      return (
        <>
          <Typography variant="p" as="div" textAlign={'center'} padding="0 10px">
            <Trans>All fees claimed</Trans>
          </Typography>

          <Button mt={5} onClick={toggleWalletModal}>
            Check another wallet
          </Button>
        </>
      );
    } else if (hasFee) {
      return (
        <>
          {fees &&
            Object.keys(fees)
              .filter(key => fees[key].greaterThan(0))
              .map(key => (
                <Typography key={key} variant="p">
                  {`${fees[key].toFixed(2)}`}{' '}
                  <Typography key={key} as="span" color="text1">
                    {fees[key].currency.symbol}
                  </Typography>
                </Typography>
              ))}
          {shouldLedgerSign && (
            <Box mt={2}>
              <Spinner></Spinner>
            </Box>
          )}
          {!shouldLedgerSign && (
            <>
              <Button mt={2} onClick={handleFeeClaim} fontSize={14}>
                {count && count > 1 ? t`Claim (1 of ${count})` : t`Claim`}
              </Button>
            </>
          )}
        </>
      );
    } else {
      return (
        <>
          <Typography variant="p" as="div" textAlign={'center'} padding="0 10px">
            <Trans>No fees to claim</Trans>
          </Typography>

          <Button mt={5} onClick={toggleWalletModal}>
            Check another wallet
          </Button>
        </>
      );
    }
  };

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
          <Gradient>Claim</Gradient> network fees
        </Separator>
        <Typography variant="p" fontSize={20} maxWidth="500px" textAlign="center" color="text1">
          Balanced network fees have moved to a continuous rewards structure. Sign in to check for and claim any
          outstanding fees earned between April 26, 2021 – July 21, 2022.
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

          {account && getNetworkFeesUI()}
        </Flex>
      </Box>
    </Container>
  );
}
