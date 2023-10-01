import React, { useState } from 'react';

import { Trans, t } from '@lingui/macro';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useIconReact } from 'packages/icon-react';
import babelParser from 'prettier/parser-babel';
import prettier from 'prettier/standalone';
import { useParams } from 'react-router-dom';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled, { css, useTheme } from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import Column from 'app/components/Column';
import { UnderlineText } from 'app/components/DropdownText';
import { BoxPanel } from 'app/components/Panel';
import { StyledSkeleton } from 'app/components/ProposalInfo';
import {
  VoteDateEndLabel,
  VoterNumberLabel,
  VoterPercentLabel,
  VoteStatusLabel,
} from 'app/components/ProposalInfo/components';
import { ProposalModal, ModalStatus } from 'app/components/ProposalModal';
import { Typography } from 'app/theme';
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg';
import { ReactComponent as CheckCircleIcon } from 'assets/icons/check_circle.svg';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import bnJs from 'bnJs';
import { useProposalInfoQuery, useUserVoteStatusQuery, useUserWeightQuery } from 'queries/vote';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useFetchBBalnInfo } from 'store/bbaln/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { useWalletFetchBalances } from 'store/wallet/hooks';
import { formatTimeStr } from 'utils/timeformat';

dayjs.extend(duration);

const ProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const Progress = styled(Flex)`
  position: relative;
  height: 15px;
  width: 100%;
  background-color: #123955;
  border-radius: 5px;
`;

const ProgressBar = styled(Flex)<{ percentage: string; type: string }>`
  background: ${props =>
    (props.type === 'Approve' && props.theme.colors.primary) || (props.type === 'Reject' && props.theme.colors.alert)};
  height: 100%;
  border-radius: ${props => (props.percentage === '100' ? '5px' : '5px 0 0 5px')};
  transition: width 0.2s ease-in;
  justify-content: center;
  width: ${({ percentage }) => `${percentage}%`};
`;

const ResultPanel = styled(Flex)`
  border-radius: 10px;
  width: 100%;
  align-items: center;
  gap: 20px;
  padding: 15px 25px;
  min-height: 90px;
  max-width: 'initial';

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 15px 30px;
  `}

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding: 15px 30px;
    max-width: 360px;
  `}
`;
const ChangeVoteButton = styled(Typography)`
  color: ${({ theme }) => theme.colors.primaryBright};
  cursor: pointer;
  transition: color ease 0.2s;
  font-size: 14px;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const StyledCode = styled.pre`
  font-size: 14px;
  border-radius: 5px 10px 10px 5px;
  padding: 20px;
  ${({ theme }) => css`
    background-color: ${theme.colors.bg5};
    border-left: 2px solid ${theme.colors.primary};
  `};
`;

export function ProposalPage() {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();

  useWalletFetchBalances(account, accountArch);
  useFetchBBalnInfo(account);
  const [modalStatus, setModalStatus] = useState(ModalStatus.None);
  const { id: pId } = useParams<{ id: string }>();
  const proposalQuery = useProposalInfoQuery(parseInt(pId));
  const { data: proposal } = proposalQuery;
  const { data: votingWeight } = useUserWeightQuery(proposal?.snapshotBlock);
  const voteStatusQuery = useUserVoteStatusQuery(proposal?.id);
  const { data: userStatus } = voteStatusQuery;
  const isSmallScreen = useMedia('(max-width: 600px)');

  const actions = JSON.parse(proposal?.actions || '{}');
  const stringifiedActions = JSON.stringify(actions);

  const isActive =
    proposal && proposal.status === 'Active' && !formatTimeStr(proposal.startDay) && !!formatTimeStr(proposal.endDay);

  const hasUserVoted = userStatus?.hasVoted;

  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const [txHash, setTxHash] = useState('');
  const handleSubmit = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const hasApproved = modalStatus === ModalStatus.Approve || modalStatus === ModalStatus.ChangeToApprove;

    bnJs
      .inject({ account })
      .Governance.castVote(proposal?.id!, hasApproved)
      .then((res: any) => {
        addTransaction(
          { hash: res.result },
          {
            pending: t`Casting your vote...`,
            summary: t`Vote cast.`,
          },
        );

        setTxHash(res.result);
        setModalStatus(ModalStatus.None);
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
      });
  };

  const txStatus = useTransactionStatus(txHash);

  React.useEffect(() => {
    if (txStatus === TransactionStatus.success) {
      proposalQuery.refetch();
      voteStatusQuery.refetch();
    }
  }, [proposalQuery, voteStatusQuery, txStatus]);

  const theme = useTheme();

  const handleChangeVote = () => {
    if (!userStatus?.reject.isZero()) {
      setModalStatus(ModalStatus.ChangeToApprove);
    } else if (!userStatus?.approval.isZero()) {
      setModalStatus(ModalStatus.ChangeToReject);
    }
  };

  return (
    <>
      <ProposalContainer>
        {proposal ? (
          <Breadcrumb locationText={t`Vote`} locationPath="/vote" title={proposal?.name || ''} />
        ) : (
          <StyledSkeleton animation="wave" width={280} height={28} />
        )}

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb={4}>
            {proposal ? proposal.name : <StyledSkeleton animation="wave" height={35} />}
          </Typography>

          <Flex alignItems="center" mb={3} flexWrap="wrap" sx={{ columnGap: '15px' }} my={1}>
            <VoteStatusLabel proposal={proposal} />
            <VoteDateEndLabel proposal={proposal} />
            <VoterPercentLabel value={proposal?.sum} />
            <VoterNumberLabel value={proposal?.voters} />
          </Flex>

          {hasUserVoted ? (
            <Flex
              sx={{ gap: 20 }}
              alignItems={['stretch', 'stretch', 'flex-end']}
              flexDirection={['column', 'column', 'row']}
            >
              <Flex flex={1} flexDirection="column" width="100%" sx={{ rowGap: '15px' }}>
                <Flex alignItems="center">
                  <Typography fontWeight="bold" variant="p" mr="5px">
                    <Trans>Approve</Trans>
                  </Typography>
                  <Typography opacity="0.85" mr="5px" fontWeight="bold">
                    {proposal?.for}%
                  </Typography>
                  <Typography opacity="0.85" fontWeight="bold">
                    <Trans>({proposal?.majority}% required)</Trans>
                  </Typography>
                </Flex>

                <Progress>
                  <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                </Progress>

                <Flex alignItems="center">
                  <Typography fontWeight="bold" variant="p" mr="5px">
                    <Trans>Reject</Trans>
                  </Typography>
                  <Typography opacity="0.85" mr="5px" fontWeight="bold">
                    {proposal?.against}%
                  </Typography>
                </Flex>

                <Progress>
                  <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
                </Progress>
              </Flex>

              {!userStatus?.approval.isZero() && (
                <ResultPanel bg="bg3">
                  <CheckCircleIcon width="30px" height="30px" color={theme.colors.primary} />
                  <Flex flexDirection="column">
                    <Flex alignItems="flex-end" flexWrap="wrap" mb={1}>
                      <Typography variant="h3" marginRight={2}>
                        <Trans>You approved</Trans>
                      </Typography>
                      {isActive && account && (
                        <ChangeVoteButton onClick={handleChangeVote}>
                          <Trans>Change vote</Trans>
                        </ChangeVoteButton>
                      )}
                    </Flex>
                    <Typography>
                      <Trans>{`Voting weight: ${userStatus?.approval.dp(2).toFormat()} bBALN`}</Trans>
                    </Typography>
                  </Flex>
                </ResultPanel>
              )}

              {!userStatus?.reject.isZero() && (
                <ResultPanel bg="bg3">
                  <CancelIcon width="30px" height="30px" color={theme.colors.alert} />
                  <Flex flexDirection="column">
                    <Flex alignItems="flex-end" flexWrap="wrap" mb={1}>
                      <Typography variant="h3" marginRight={2}>
                        <Trans>You rejected</Trans>
                      </Typography>
                      {isActive && account && (
                        <ChangeVoteButton onClick={handleChangeVote}>
                          <Trans>Change vote</Trans>
                        </ChangeVoteButton>
                      )}
                    </Flex>

                    <Typography>
                      <Trans>{`Voting weight: ${userStatus?.reject.dp(2).toFormat()} bBALN`}</Trans>
                    </Typography>
                  </Flex>
                </ResultPanel>
              )}
            </Flex>
          ) : (
            <Flex flexDirection="column">
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  <Trans>Approve</Trans>
                </Typography>
                <Typography opacity="0.85" mr="5px" fontWeight="bold">
                  {proposal?.for}%
                </Typography>
                <Typography opacity="0.85" fontWeight="bold">
                  <Trans>({proposal?.majority}% required)</Trans>
                </Typography>
              </Flex>
              <Flex>
                <Column flexGrow={1}>
                  <Progress my={3}>
                    <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                  </Progress>
                </Column>
                {isActive && account && !isSmallScreen && (
                  <Column>
                    <Button ml="20px" width="150px" onClick={() => setModalStatus(ModalStatus.Approve)}>
                      <Trans>Approve</Trans>
                    </Button>
                  </Column>
                )}
              </Flex>
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  <Trans>Reject</Trans>
                </Typography>
                <Typography opacity="0.85" mr="5px" fontWeight="bold">
                  {proposal?.against}%
                </Typography>
              </Flex>
              <Flex>
                <Column flexGrow={1}>
                  <Progress my={3}>
                    <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
                  </Progress>
                </Column>
                {isActive && account && !isSmallScreen && (
                  <Column>
                    <AlertButton ml="20px" width="150px" color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                      <Trans>Reject</Trans>
                    </AlertButton>
                  </Column>
                )}
              </Flex>
            </Flex>
          )}

          {isActive && account && isSmallScreen && !hasUserVoted ? (
            <Flex marginTop={2}>
              <Button width="50%" marginRight={2} onClick={() => setModalStatus(ModalStatus.Approve)}>
                <Trans>Approve</Trans>
              </Button>
              <AlertButton width="50%" marginLeft={2} color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                <Trans>Reject</Trans>
              </AlertButton>
            </Flex>
          ) : null}

          <ProposalModal
            status={modalStatus}
            onCancel={() => setModalStatus(ModalStatus.None)}
            onSubmit={handleSubmit}
            weight={votingWeight}
          />
        </BoxPanel>

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb="20px">
            <Trans>Description</Trans>
          </Typography>
          <Typography variant="p" mb="20px">
            {proposal ? (
              proposal?.description
            ) : (
              <>
                <StyledSkeleton height={22} />
                <StyledSkeleton height={22} />
                <StyledSkeleton height={22} width={220} />
              </>
            )}
          </Typography>
          {proposal && proposal.forumLink && (
            <a href={proposal && proposal.forumLink} target="_blank" rel="noreferrer">
              <Typography color="primary" variant="span" style={{ textDecoration: 'none' }}>
                <UnderlineText>View forum discussion</UnderlineText>
              </Typography>

              <ExternalIcon width="14" height="14" style={{ marginLeft: 5, marginRight: 15, marginTop: -4 }} />
            </a>
          )}
        </BoxPanel>

        {proposal?.actions && stringifiedActions.indexOf('[') === 0 && stringifiedActions !== '[]' && (
          <BoxPanel bg="bg2" my={10}>
            <Typography variant="h2" mb="20px">
              <Trans>Smart contract details</Trans>
            </Typography>
            <StyledCode>{prettier.format(stringifiedActions, { plugins: [babelParser] })}</StyledCode>
          </BoxPanel>
        )}
      </ProposalContainer>
    </>
  );
}
