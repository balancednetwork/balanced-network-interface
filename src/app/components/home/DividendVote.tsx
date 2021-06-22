import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import { Link } from 'app/components/Link';
import Modal from 'app/components/Modal';
import { FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg';
import { ReactComponent as CheckCircleIcon } from 'assets/icons/check_circle.svg';
import bnJs from 'bnJs';
import { useTotalCollectedFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

const useVoteStatus = () => {
  const [status, setStatus] = React.useState<{
    against: number;
    for: number;
    startDay: number;
    endDay: number;
    name: string;
  }>();

  React.useEffect(() => {
    const fetch = async () => {
      const res = await bnJs.Governance.checkVote(1);
      const _status = {
        id: parseInt(res.id, 16),
        name: res['name'],
        against: parseInt(res.against, 16),
        for: parseInt(res.for, 16),
        startDay: parseInt(res['start day'], 16),
        endDay: parseInt(res['end day'], 16),
        result: res['result'],
      };
      setStatus(_status);
    };

    fetch();
  }, []);

  return status;
};

const DividendVote = () => {
  const theme = useTheme();
  const [hasApproved, setHasApproved] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const [hasVoted, setHasVoted] = React.useState(false);

  const handleCancel = () => {
    setHasVoted(false);
    toggleOpen();
  };

  const fees = useTotalCollectedFees();

  const addTransaction = useTransactionAdder();
  const { account } = useIconReact();

  const handleVote = () => {
    if (status) {
      bnJs
        .inject({ account })
        .Governance.castVote(status.name, hasApproved)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: `Voting...`,
              summary: `Voted.`,
            },
          );
        })
        .catch(e => {
          console.error('error', e);
        });
    }
  };

  const getContent = () => {
    if (hasVoted) {
      return (
        <>
          <FlexPanel mt={5} mb={3} bg="bg3" flexDirection="column">
            <Flex justifyContent="space-between">
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Approved
                </Typography>
                <Typography variant="p" color="text">
                  {status?.for}%
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Rejected
                </Typography>
                <Typography variant="p" color="text">
                  {status?.against}%
                </Typography>
              </Flex>
            </Flex>

            <Divider my={3} />

            <Flex justifyContent="space-between">
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Your vote
                </Typography>
                <Typography variant="p" color="text">
                  Approve
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Your weight
                </Typography>
                <Typography variant="p" color="text">
                  {BALNstaked.dp(2).toFormat()} BALN
                </Typography>
              </Flex>
            </Flex>
          </FlexPanel>

          <Typography variant="p" my={1} textAlign="center" color="text1">
            Voting ends in{' '}
            <Typography fontWeight="bold" color="white" as="span">
              2 days, 14 hours
            </Typography>
            .
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={handleCancel} fontSize={14}>
              Close
            </Button>
          </Flex>
        </>
      );
    } else
      return (
        <>
          <Flex mt={5} mb={3} justifyContent="center">
            <OptionButton mx={1} selected={!hasApproved} onClick={() => setHasApproved(false)}>
              <CancelIcon width="30px" height="30px" color={!hasApproved ? theme.colors.alert : '#8695a6 '} />
              <Typography fontWeight="bold" lineHeight="20px" mt={2}>
                Reject
              </Typography>
            </OptionButton>

            <OptionButton mx={1} selected={hasApproved} onClick={() => setHasApproved(true)}>
              <CheckCircleIcon width="30px" height="30px" color={hasApproved ? theme.colors.primary : '#8695a6 '} />
              <Typography fontWeight="bold" lineHeight="20px" mt={2}>
                Approve
              </Typography>
            </OptionButton>
          </Flex>
          <Typography textAlign="center">
            {'Your voting weight is '}
            <Typography fontWeight="bold" color="white" as="span">
              {BALNstaked.dp(2).toFormat()} BALN
            </Typography>
            {'.'}
          </Typography>

          <Typography textAlign="center">
            {'Voting ends in '}
            <Typography fontWeight="bold" color="white" as="span">
              2 days, 14 hours
            </Typography>
            {'.'}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Not now
            </TextButton>

            <Button onClick={handleVote} fontSize={14}>
              Submit vote
            </Button>
          </Flex>
        </>
      );
  };

  const status = useVoteStatus();

  const { BALNstaked } = useWalletBalances();

  return (
    <>
      {!hasVoted ? (
        <Link onClick={toggleOpen}>Vote to distribute fees</Link>
      ) : (
        <Link onClick={toggleOpen}>Check voting progress</Link>
      )}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Balanced DAO vote
          </Typography>
          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20} mb={3}>
            Distribute network fees?
          </Typography>
          <Flex flexDirection="column" alignItems="stretch">
            <Typography>Vote to distribute network fees every day, starting from June 30.</Typography>
            <ul>
              <li>
                <Typography>60% will go to eligible BALN holders</Typography>
              </li>
              <li>
                <Typography>40% will go to the DAO fund</Typography>
              </li>
            </ul>
            <Typography>
              To be eligible for network fees, stake BALN from your wallet, and/or supply BALN to a liquidity pool.
            </Typography>
          </Flex>

          <Flex flexDirection="column" alignItems="stretch" mt={5}>
            <Typography letterSpacing="3px" textAlign="center" mb={2}>
              FEES COLLECTED
            </Typography>

            <Flex>
              {Object.keys(fees)
                .filter((currencyKey: string) => !fees[currencyKey].isZero())
                .map((currencyKey: string) => (
                  <Flex key={currencyKey} flex={1} flexDirection="column" alignItems="center">
                    <Typography fontSize="16px" fontWeight="bold" color="white">
                      {fees[currencyKey].integerValue().toFormat()}
                    </Typography>
                    <Typography>{currencyKey}</Typography>
                  </Flex>
                ))}
            </Flex>
          </Flex>

          {getContent()}
        </Flex>
      </Modal>
    </>
  );
};

export default DividendVote;

const OptionButton = styled(Box)<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  width: 112px;
  font-size: 14px;
  border-radius: 10px;
  text-align: center;
  text-decoration: none;
  color: white;
  user-select: none;
  overflow: hidden;
  transition: background-color 0.3s ease;
  background-color: ${({ theme, selected }) => (selected ? theme.colors.bg3 : theme.colors.bg4)};

  :hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;
