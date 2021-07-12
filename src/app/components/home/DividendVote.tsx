import React from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { useIconReact } from 'packages/icon-react';
import { Flex, Box } from 'rebass/styled-components';
import styled, { useTheme } from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import { Link } from 'app/components/Link';
import Modal from 'app/components/Modal';
import { FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg';
import { ReactComponent as CheckCircleIcon } from 'assets/icons/check_circle.svg';
import bnJs from 'bnJs';
import { usePlatformDayQuery } from 'queries/reward';
import {
  useVoteInfoQuery,
  useUserVoteStatusQuery,
  useUserWeightQuery,
  useTotalStakedBalanceAtQuery,
  useTotalCollectedFeesQuery,
} from 'queries/vote';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import Spinner from '../Spinner';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

const DIVIDEND_VOTE_INDEX = NETWORK_ID === 1 ? 1 : 3;

enum VoteState {
  'PENDING' = 'PENDING',
  'STARTED' = 'STARTED',
  'ENDED' = 'ENDED',
}

const DividendVote = () => {
  const theme = useTheme();
  const [hasApproved, setHasApproved] = React.useState(true);

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    setOpen(!open);
  };

  const addTransaction = useTransactionAdder();
  const { account } = useIconReact();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const [txHash, setTxHash] = React.useState('');
  const handleVote = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }
    if (voteInfo) {
      bnJs
        .inject({ account })
        .Governance.castVote(voteInfo.name, hasApproved)
        .then((res: any) => {
          addTransaction(
            { hash: res.result },
            {
              pending: `Voting...`,
              summary: `Voted.`,
            },
          );

          setTxHash(res.result);
        })
        .catch(e => {
          console.error('error', e);
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
          changeShouldLedgerSign(false);
        });
    }
  };

  const voteInfoQuery = useVoteInfoQuery(DIVIDEND_VOTE_INDEX);
  const voteInfo = voteInfoQuery.data;
  const voteStatusQuery = useUserVoteStatusQuery(DIVIDEND_VOTE_INDEX);
  const voteStatus = voteStatusQuery.data;
  const weightQuery = useUserWeightQuery(voteInfo?.snapshotDay);
  const weight = weightQuery.data;
  const platformDayQuery = usePlatformDayQuery();
  const platformDay = platformDayQuery.data;
  const totalStakedBALNQuery = useTotalStakedBalanceAtQuery(voteInfo?.snapshotDay);
  const totalStakedBALN = totalStakedBALNQuery.data;
  const feesQuery = useTotalCollectedFeesQuery();
  const fees = feesQuery.data;

  const txStatus = useTransactionStatus(txHash);

  React.useEffect(() => {
    if (txStatus === TransactionStatus.success) {
      voteInfoQuery.refetch();
      voteStatusQuery.refetch();
    }
  }, [voteInfoQuery, voteStatusQuery, txStatus]);

  const getVoteState = (): VoteState | undefined => {
    if (!voteInfo || !platformDay) return;

    if (voteInfo.startDay > platformDay) return VoteState.PENDING;
    else if (voteInfo.startDay <= platformDay && voteInfo.endDay > platformDay) return VoteState.STARTED;
    else return VoteState.ENDED;
  };

  let voteState = getVoteState();
  //
  let startTimeStr =
    voteInfo && platformDay
      ? dayjs()
          .utc()
          .add(voteInfo.startDay - platformDay, 'day')
          .hour(17)
          .fromNow()
      : '';

  let endTimeStr =
    voteInfo && platformDay
      ? dayjs()
          .utc()
          .add(voteInfo.endDay - platformDay - 1, 'day')
          .hour(17)
          .fromNow()
      : '';

  const getContent = () => {
    if (!voteState || !voteStatus) return;

    if (voteState === VoteState.PENDING) {
      return (
        <>
          <Typography variant="p" my={1} textAlign="center" color="text1">
            {'Voting starts '}
            <Typography fontWeight="bold" color="white" as="span">
              {startTimeStr}
            </Typography>
            {'.'}
          </Typography>
          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={toggleOpen} fontSize={14}>
              Close
            </Button>
          </Flex>
        </>
      );
    } else if (voteState === VoteState.STARTED && voteStatus.hasVoted) {
      return (
        <>
          <FlexPanel mt={5} mb={3} bg="bg3" flexDirection="column">
            <Flex justifyContent="space-between">
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Approved
                </Typography>
                <Typography variant="p" color="text">
                  {voteInfo?.for}%
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Rejected
                </Typography>
                <Typography variant="p" color="text">
                  {voteInfo?.against}%
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
                  {!voteStatus?.approval.isZero() && 'Approved'}
                  {!voteStatus?.reject.isZero() && 'Rejected'}
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Your weight
                </Typography>
                <Typography variant="p" color="text">
                  {weight?.dp(2).toFormat()} BALN
                </Typography>
              </Flex>
            </Flex>
          </FlexPanel>

          <Typography variant="p" my={1} textAlign="center" color="text1">
            {'Voting ends '}
            <Typography fontWeight="bold" color="white" as="span">
              {endTimeStr}
            </Typography>
            {'. '}
            {`${totalStakedBALN?.integerValue().toFormat()} BALN is staked, and ${voteInfo?.sum}% has voted 
              (${voteInfo?.quorum}% required).`}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={toggleOpen} fontSize={14}>
              Close
            </Button>
          </Flex>
        </>
      );
    } else if (voteState === VoteState.STARTED && !voteStatus.hasVoted) {
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
              {weight?.dp(2).toFormat()} BALN
            </Typography>
            {'.'}
          </Typography>

          <Typography variant="p" my={1} textAlign="center" color="text1">
            {'Voting ends '}
            <Typography fontWeight="bold" color="white" as="span">
              {endTimeStr}
            </Typography>
            {'. '}
            {`${totalStakedBALN?.integerValue().toFormat()} BALN is staked, and ${voteInfo?.sum}% has voted 
              (${voteInfo?.quorum}% required).`}
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Not now
                </TextButton>

                <Button onClick={handleVote} fontSize={14}>
                  Submit vote
                </Button>
              </>
            )}
          </Flex>
          {/* ledger */}
          <LedgerConfirmMessage mt={2} />
        </>
      );
    } else if (voteState === VoteState.ENDED) {
      return (
        <>
          <FlexPanel mt={5} mb={3} bg="bg3" flexDirection="column">
            <Flex justifyContent="space-between">
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Approved
                </Typography>
                <Typography variant="p" color="text">
                  {voteInfo?.for}%
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Rejected
                </Typography>
                <Typography variant="p" color="text">
                  {voteInfo?.against}%
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
                  {!voteStatus?.approval.isZero() && 'Approved'}
                  {!voteStatus?.reject.isZero() && 'Rejected'}
                </Typography>
              </Flex>
              <Flex flex={1} flexDirection="column" alignItems="center">
                <Typography variant="p" color="text1" mb={1}>
                  Your weight
                </Typography>
                <Typography variant="p" color="text">
                  {weight?.dp(2).toFormat()} BALN
                </Typography>
              </Flex>
            </Flex>
          </FlexPanel>

          <Typography variant="p" my={1} textAlign="center" color="text1">
            Voting ended{' '}
            <Typography fontWeight="bold" color="white" as="span">
              {endTimeStr}
            </Typography>
            .
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <Button onClick={toggleOpen} fontSize={14}>
              Close
            </Button>
          </Flex>
        </>
      );
    }
  };

  if (!voteInfo) return null;

  return (
    <>
      {!(voteStatus && voteStatus.hasVoted) ? (
        <Link onClick={toggleOpen}>Vote to distribute fees</Link>
      ) : (
        <Link onClick={toggleOpen}>Check voting progress</Link>
      )}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex className="scrollbar scrollbar-primary" flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb={1}>
            Balanced DAO vote
          </Typography>
          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20} mb={3}>
            Distribute network fees?
          </Typography>
          <Flex flexDirection="column" alignItems="stretch">
            <Typography>Vote to distribute network fees every day.</Typography>
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
              {fees &&
                Object.keys(fees)
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
