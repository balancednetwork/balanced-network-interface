import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button } from 'app/components/Button';
import Logo from 'app/components/Logo';
import { Typography } from 'app/theme';
import AirdripImg from 'assets/images/airdrip.png';
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

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const startDate = new Date('2021-05-03T07:00:00Z');

const formatDate = (date: Date) => {
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

export function Airdrip() {
  const toggleWalletModal = useWalletModalToggle();
  const { account, networkId } = useIconReact();

  const addTransaction = useTransactionAdder();
  const txs = useAllTransactions();
  const handleClaim = async () => {
    if (data && account && details) {
      window.addEventListener('beforeunload', showMessageOnBeforeUnload);
      try {
        const res = await bnJs
          .inject({ account })
          .Airdrip.claimToken(data.index, data.votes, data.proof, bnJs.BALN.address);
        addTransaction(
          { hash: res.result },
          {
            pending: 'Claiming airdrip',
            summary: `Claimed airdrip`,
          },
        );
      } catch (e) {
        console.error(e);
      } finally {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      }
    }
  };

  const below600 = useMedia('(max-width: 600px)');

  const [data, setData] = React.useState<{
    index: number;
    root: string;
    proof: [string];
    votes: number;
    address: string;
    claimDetails: [{ claimStatus: string; tokenName: string; address: string; amount: number }];
  }>();
  const details = data?.claimDetails.find(item => item.address === bnJs.BALN.address);

  const [errorMsg, setErrorMsg] = React.useState('');
  React.useEffect(() => {
    const fetchStatus = async () => {
      setErrorMsg('');
      setData(undefined);
      try {
        const url =
          networkId === 1
            ? `https://airdrip.co/api/v1/claim-detail?address=${account}`
            : `https://stage.airdrip.co/api/v1/claim-detail?address=${account}`;
        const { data: res } = await axios.get(url);
        if (res.success) {
          setData(res.data);
        }
      } catch (e) {
        if (e.response && e.response.status === 404) {
          setErrorMsg('Not eligible. Stake and delegate your ICX, then try again next week.');
        } else {
          setErrorMsg(e.message);
        }
      }
    };

    if (account) fetchStatus();
  }, [account, txs, networkId]);

  const [tokenDetails, setTokenDetails] = React.useState<{
    name: string;
    address: string;
    symbol: string;
    totalBalance: BigNumber;
    distributingThisWeek: BigNumber;
    distributedAmount: BigNumber;
  }>();

  React.useEffect(() => {
    const fetchTokensDetails = async () => {
      const res: Array<{
        name: string;
        address: string;
        symbol: string;
        totalBalance: string;
        distributingThisWeek: string;
        distributedAmount: string;
      }> = await bnJs.Airdrip.getTokensDetails();
      const BALNTokenDetails = res.find(token => token.address === bnJs.BALN.address);

      if (BALNTokenDetails) {
        setTokenDetails({
          name: BALNTokenDetails.name,
          address: BALNTokenDetails.address,
          symbol: BALNTokenDetails.symbol,
          totalBalance: BalancedJs.utils.toIcx(BALNTokenDetails.totalBalance),
          distributingThisWeek: BalancedJs.utils.toIcx(BALNTokenDetails.distributingThisWeek),
          distributedAmount: BalancedJs.utils.toIcx(BALNTokenDetails.distributedAmount),
        });
      }
    };

    fetchTokensDetails();
  }, [txs]);

  const [date, setDate] = React.useState<Date>();
  React.useEffect(() => {
    const fetchTime = async () => {
      const [res1, res2] = await Promise.all([bnJs.Airdrip.getStartTimestamp(), bnJs.Airdrip.getAirdripDuration()]);
      const unix = new BigNumber(res1).plus(new BigNumber(res2)).div(1000).integerValue().toNumber();
      setDate(new Date(unix));
    };

    fetchTime();
  }, []);

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
            {tokenDetails ? (
              <>
                <Typography variant="h3" fontWeight="bold">
                  {`${tokenDetails?.distributedAmount.dp(2).toFormat()} / 
                    ${tokenDetails?.distributingThisWeek.dp(2).toFormat()} `}
                  <Typography fontSize="16px" lineHeight="25px" as="span" color="rgba(255,255,255,0.75)">
                    {tokenDetails?.symbol}
                  </Typography>
                </Typography>
                <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)" mb={3}>
                  Claimed this week
                </Typography>
                <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)">
                  This drip dries up on
                </Typography>
                <Typography variant="p" fontWeight="bold">
                  {date && formatDate(date)}
                </Typography>
              </>
            ) : (
              <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)">
                Accumulating BALN...
              </Typography>
            )}
          </Flex>

          <Flex flex={1} flexDirection="column" alignItems="center" py={['25px', '35px']}>
            {!account && tokenDetails && (
              <>
                <Button onClick={toggleWalletModal}>Sign in to claim</Button>
              </>
            )}

            {!account && !tokenDetails && (
              <>
                <Typography variant="p" fontSize="18px" lineHeight="35px" color="rgba(255,255,255,0.75)">
                  The first airdrip drops on
                </Typography>

                <Typography variant="p" fontWeight="bold">
                  {formatDate(startDate)}
                </Typography>
              </>
            )}

            {account && (
              <Typography
                variant="p"
                fontSize="18px"
                lineHeight="35px"
                color="rgba(255,255,255,0.75)"
                textAlign="center"
              >
                Wallet: {shortenAddress(account)}
              </Typography>
            )}

            {account && errorMsg && (
              <>
                <Typography variant="p" fontSize="18px" fontWeight="bold" color="alert" textAlign="center">
                  {errorMsg}
                </Typography>
                <Button mt={5} onClick={toggleWalletModal}>
                  Check another wallet
                </Button>
              </>
            )}

            {account && details && details.claimStatus === 'unclaimed' && (
              <>
                <Typography variant="p" fontSize="18px" fontWeight="bold">
                  {details.amount} BALN
                </Typography>
                <Button mt={5} onClick={handleClaim}>
                  Claim airdrip
                </Button>
              </>
            )}

            {account && details && details.claimStatus !== 'unclaimed' && (
              <>
                <Typography variant="p" fontSize="18px" fontWeight="bold">
                  Airdrip claimed
                </Typography>
                <Button mt={5} onClick={toggleWalletModal}>
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
