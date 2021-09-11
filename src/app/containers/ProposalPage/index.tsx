import React, { useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { useIconReact } from 'packages/icon-react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';
import styled, { useTheme, keyframes } from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import { Column } from 'app/components/Column';
import { DefaultLayout } from 'app/components/Layout';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { StyledSkeleton } from 'app/components/ProposalInfo';
import { ProposalModal, ModalStatus } from 'app/components/ProposalModal';
import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as CancelIcon } from 'assets/icons/cancel.svg';
import { ReactComponent as CheckCircleIcon } from 'assets/icons/check_circle.svg';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import bnJs from 'bnJs';
import { usePlatformDayQuery } from 'queries/reward';
import { useAdditionalInfoById, useProposalInfoQuery, useUserVoteStatusQuery, useUserWeightQuery } from 'queries/vote';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { getTrackerLink } from 'utils';

import { ActionsMapping, RATIO_VALUE_FORMATTER } from '../NewProposalPage/constant';
import Ratio from './Ratio';

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

const setBarWidth = (width: string) => keyframes`
    0% {
        width : 0; 
    }
    100% {
        width : ${width}%;
    }
`;

const ProgressBar = styled(Flex)<{ percentage: string; type: string }>`
  background: ${props =>
    (props.type === 'Approve' && props.theme.colors.primary) || (props.type === 'Reject' && props.theme.colors.alert)};
  height: 100%;
  border-radius: ${props => (props.percentage === '100' ? '5px' : '5px 0 0 5px')};
  transition: width 0.2s ease-in;
  justify-content: center;
  animation: ${({ percentage }) => setBarWidth(percentage)} 2s ease-in-out forwards;
`;

const ResultPanel = styled(Flex)`
  border-radius: 10px;
  width: 100%;
  align-items: center;
  gap: 20px;
  padding: 15px 25px;
  height: 90px;
  max-width: 'initial';

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 15px 40px;
  `}

  ${({ theme }) => theme.mediaWidth.upSmall`
    padding: 15px 40px;
    max-width: 360px;
  `}
`;

export function ProposalPage() {
  const [modalStatus, setModalStatus] = useState(ModalStatus.None);
  const { id: pId } = useParams<{ id: string }>();
  const proposalQuery = useProposalInfoQuery(parseInt(pId));
  const { data: proposal } = proposalQuery;
  const { data: votingWeight } = useUserWeightQuery(proposal?.snapshotDay);
  const voteStatusQuery = useUserVoteStatusQuery(proposal?.id);
  const { data: userStatus } = voteStatusQuery;
  const { data: platformDay } = usePlatformDayQuery();

  const actions = JSON.parse(proposal?.actions || '{}');
  const actionKeys = Object.keys(actions);

  const getKeyByValue = value => {
    return Object.keys(ActionsMapping).find(key => ActionsMapping[key].includes(value));
  };

  const ratioAction = actionKeys.find(actionKey => getKeyByValue(actionKey));

  const proposalType = actionKeys.map(actionKey => getKeyByValue(actionKey)).filter(item => item)[0];

  const isActive =
    proposal &&
    platformDay &&
    proposal.status === 'Active' &&
    proposal.startDay <= platformDay &&
    proposal.endDay > platformDay;
  const hasUserVoted = isActive && userStatus?.hasVoted;

  const { account } = useIconReact();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const [txHash, setTxHash] = useState('');
  const handleSubmit = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    const hasApproved = modalStatus === ModalStatus.Approve;

    bnJs
      .inject({ account })
      .Governance.castVote(proposal?.id!, hasApproved)
      .then((res: any) => {
        addTransaction(
          { hash: res.result },
          {
            pending: `Casting your vote...`,
            summary: `Vote cast.`,
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

  const { networkId } = useIconReact();
  const additionalInfo = useAdditionalInfoById(proposal?.id);

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <ProposalContainer>
        {proposal ? (
          <Breadcrumb locationText="Vote" locationPath="/vote" title={proposal?.name || ''} />
        ) : (
          <StyledSkeleton animation="wave" width={280} height={28} />
        )}

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb={4}>
            {proposal ? proposal.name : <StyledSkeleton animation="wave" height={35} />}
          </Typography>
          <Flex alignItems="center" mb={3} flexWrap="wrap" sx={{ columnGap: '15px' }}>
            {proposal?.status && proposal?.startDay && proposal?.endDay ? (
              <ProposalStatusIcon status={proposal.status} startDay={proposal.startDay} endDay={proposal.endDay} />
            ) : (
              <>
                <StyledSkeleton animation="wave" width={22} height={22} variant="circle" />
                <StyledSkeleton animation="wave" width={80} />
              </>
            )}

            <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
              <PieChartIcon height="22" width="22" />
              <Typography variant="content" color="white">
                {proposal?.sum ? `${proposal?.sum}% voted` : <StyledSkeleton animation="wave" width={80} />}
              </Typography>
            </Flex>

            <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
              <UserIcon height="22" width="22" />
              <Typography variant="content" color="white">
                {typeof proposal?.voters === 'number' ? (
                  proposal.id === 1 ? (
                    `- voters`
                  ) : (
                    `${proposal?.voters} voters`
                  )
                ) : (
                  <StyledSkeleton animation="wave" width={80} />
                )}
              </Typography>
            </Flex>
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
                    Approve
                  </Typography>
                  <Typography opacity="0.85" mr="5px" fontWeight="bold">
                    {proposal?.for}%
                  </Typography>
                  <Typography opacity="0.85" fontWeight="bold">
                    {`(${proposal?.majority}% required)`}
                  </Typography>
                </Flex>

                <Progress>
                  <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                </Progress>

                <Flex alignItems="center">
                  <Typography fontWeight="bold" variant="p" mr="5px">
                    Reject
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
                    <Typography variant="h3" mb={1}>
                      You approved
                    </Typography>
                    <Typography>{`Voting weight: ${userStatus?.approval.dp(2).toFormat()} BALN`}</Typography>
                  </Flex>
                </ResultPanel>
              )}

              {!userStatus?.reject.isZero() && (
                <ResultPanel bg="bg3">
                  <CancelIcon width="30px" height="30px" color={theme.colors.alert} />
                  <Flex flexDirection="column">
                    <Typography variant="h3" mb={1}>
                      You rejected
                    </Typography>
                    <Typography>{`Voting weight: ${userStatus?.reject.dp(2).toFormat()} BALN`}</Typography>
                  </Flex>
                </ResultPanel>
              )}
            </Flex>
          ) : (
            <Flex flexDirection="column">
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  Approve
                </Typography>
                <Typography opacity="0.85" mr="5px" fontWeight="bold">
                  {proposal?.for}%
                </Typography>
                <Typography opacity="0.85" fontWeight="bold">
                  {`(${proposal?.majority}% required)`}
                </Typography>
              </Flex>
              <Flex>
                <Column flexGrow={1}>
                  <Progress my={3}>
                    <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
                  </Progress>
                </Column>
                {isActive && account && (
                  <Column>
                    <Button ml="20px" width="150px" onClick={() => setModalStatus(ModalStatus.Approve)}>
                      Approve
                    </Button>
                  </Column>
                )}
              </Flex>
              <Flex alignItems="center">
                <Typography fontWeight="bold" variant="p" mr="5px">
                  Reject
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
                {isActive && account && (
                  <Column>
                    <AlertButton ml="20px" width="150px" color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                      Reject
                    </AlertButton>
                  </Column>
                )}
              </Flex>
            </Flex>
          )}

          <ProposalModal
            status={modalStatus}
            onCancel={() => setModalStatus(ModalStatus.None)}
            onSubmit={handleSubmit}
            weight={votingWeight}
          />
        </BoxPanel>

        {proposalType && ratioAction && (
          <BoxPanel bg="bg2" my={10}>
            <Typography variant="h2" mb="20px">
              {proposalType}
            </Typography>
            <Ratio
              proposalType={proposalType}
              proposedList={RATIO_VALUE_FORMATTER[proposalType](Object.values(actions[ratioAction])[0])}
            />
          </BoxPanel>
        )}

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb="20px">
            Description
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
          <Flex alignItems="center">
            {additionalInfo?.discussionURL && (
              <>
                <InfoLink href={additionalInfo?.discussionURL} target="_blank">
                  Discussion
                </InfoLink>
                <ExternalIcon width="15" height="15" style={{ marginLeft: 5, marginRight: 15 }} />
              </>
            )}
            {additionalInfo?.hash && (
              <>
                <InfoLink
                  href={additionalInfo?.hash && getTrackerLink(networkId, additionalInfo?.hash, 'transaction')}
                  target="_blank"
                >
                  Transaction
                </InfoLink>
                <ExternalIcon width="15" height="15" style={{ marginLeft: 5 }} />
              </>
            )}
          </Flex>
        </BoxPanel>
      </ProposalContainer>
    </DefaultLayout>
  );
}

const InfoLink = styled(Link)`
  font-size: 16px;
`;
