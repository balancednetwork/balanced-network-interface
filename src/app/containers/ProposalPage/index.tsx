import React, { useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import { Column } from 'app/components/Column';
import { DefaultLayout } from 'app/components/Layout';
import { BoxPanel } from 'app/components/Panel';
import { ProposalModal, ModalStatus } from 'app/components/ProposalModal';
import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import { useProposalInfoQuery, useUserWeightQuery } from 'queries/vote';

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
  margin-top: 15px;
  margin-bottom: 15px;
`;

const ProgressBar = styled(Flex)<{ percentage: string; type: string }>`
  background: ${props =>
    (props.type === 'Approve' && props.theme.colors.primary) || (props.type === 'Reject' && props.theme.colors.alert)};
  height: 100%;
  border-radius: ${props => (props.percentage === '100' ? '5px' : '5px 0 0 5px')};
  transition: width 0.2s ease-in;
  justify-content: center;
  width: ${props => `${props.percentage}%`};
`;

export function ProposalPage() {
  const [modalStatus, setModalStatus] = useState(ModalStatus.None);
  const { id: pId } = useParams<{ id: string }>();
  const { data: proposal } = useProposalInfoQuery(parseInt(pId));
  const { data: votingWeight } = useUserWeightQuery(proposal?.snapshotDay);
  const isActive = proposal?.status === 'Active';

  const handleSubmit = () => {};

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <ProposalContainer>
        <Breadcrumb locationText="Vote" locationPath="/vote" title={proposal?.name || ''} />

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb="20px">
            {proposal?.name}
          </Typography>
          <Flex alignItems="center" mb="22px">
            {proposal && (
              <ProposalStatusIcon status={proposal?.status} startDay={proposal?.startDay} endDay={proposal?.startDay} />
            )}
            <PieChartIcon height="22" width="22" style={{ marginRight: '5px' }} />
            <Typography variant="content" color="white" mr="20px">
              {proposal?.for === undefined && proposal?.against === undefined
                ? ''
                : `${proposal?.for + proposal?.against}% voted`}
            </Typography>
            <UserIcon height="22" width="22" style={{ marginRight: '5px' }} />
            <Typography variant="content" color="white" mr="20px">
              {proposal?.uniqueApproveVoters === undefined && proposal?.uniqueRejectVoters === undefined
                ? ''
                : `${proposal?.uniqueApproveVoters + proposal?.uniqueRejectVoters} voters`}
            </Typography>
          </Flex>
          <Flex alignItems="center">
            <Typography fontWeight="bold" variant="p" mr="5px">
              Approve
            </Typography>
            <Typography opacity="0.85" mr="5px" fontWeight="bold">
              {proposal?.for}%
            </Typography>
            <Typography opacity="0.85" fontWeight="bold">
              (67% required)
            </Typography>
          </Flex>
          <Flex>
            <Column flexGrow={1}>
              <Progress>
                <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
              </Progress>
            </Column>
            {isActive && (
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
              <Progress>
                <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
              </Progress>
            </Column>
            {isActive && (
              <Column>
                <AlertButton ml="20px" width="150px" color="red" onClick={() => setModalStatus(ModalStatus.Reject)}>
                  Reject
                </AlertButton>
              </Column>
            )}
          </Flex>

          <ProposalModal
            status={modalStatus}
            onCancel={() => setModalStatus(ModalStatus.None)}
            onSubmit={() => handleSubmit}
            weight={votingWeight?.dp(2).toNumber()}
          />
        </BoxPanel>

        <BoxPanel bg="bg2" my={10}>
          <Typography variant="h2" mb="20px">
            Description
          </Typography>
          <Typography variant="p" mb="20px">
            {proposal?.description}
          </Typography>
          <Flex alignItems="center">
            <Typography variant="p" mr="5px" color="primaryBright" style={{ cursor: 'pointer' }}>
              Discussion
            </Typography>
            <ExternalIcon width="15" height="15" style={{ marginRight: '20px' }} />
            <Typography variant="p" mr="5px" color="primaryBright" style={{ cursor: 'pointer' }}>
              Transaction
            </Typography>
            <ExternalIcon width="15" height="15" />
          </Flex>
        </BoxPanel>
      </ProposalContainer>
    </DefaultLayout>
  );
}
