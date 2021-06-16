import React from 'react';

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
import { useTotalCollectedFees } from 'store/reward/hooks';

const DividendVote = () => {
  const theme = useTheme();
  const [hasApproved, setHasApproved] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const [hasVoted, setHasVoted] = React.useState(true);

  const handleVote = () => {
    setHasVoted(true);
  };

  const handleCancel = () => {
    setHasVoted(false);
    toggleOpen();
  };

  const fees = useTotalCollectedFees();

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
                  17%
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Rejected
                </Typography>
                <Typography variant="p" color="text">
                  1%
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
                  2500 BALN
                </Typography>
              </Flex>
            </Flex>
          </FlexPanel>

          <Typography variant="p" my={1} textAlign="center" color="text1">
            Voting ends in{' '}
            <Typography fontWeight="bold" color="white" as="span">
              2 days, 14 hours
            </Typography>
            , or when 20% of staked BALN have approved the proposal.
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
              2,500 BALN
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
                  <Flex flex={1} flexDirection="column" alignItems="center">
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
