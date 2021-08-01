import React, { useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import { Column } from 'app/components/Column';
import { DefaultLayout } from 'app/components/Layout';
import { ProposalModal } from 'app/components/ProposalModal';
import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import { useProposalInfoQuery } from 'queries/vote';
import { getNumberFromEndURL } from 'utils';

dayjs.extend(duration);

const ProposalContainer = styled(Box)`
  flex: 1;
  border-radius: 10px;
`;

const ProposalPanel = styled(Box)`
  flex: 1;
  border-radius: 10px;
  padding: 35px 35px;
  background-color: ${({ theme }) => theme.colors.bg2};
  margin-bottom: 50px;
  margin-top: 50px;
`;

const StatsContainer = styled.span`
  display: flex;
  flex-direction: row;
  flex: 1;
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
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const location = useLocation();
  const pId = getNumberFromEndURL(location.pathname);

  const { data: proposal } = useProposalInfoQuery(pId);

  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <ProposalContainer>
        <Breadcrumb locationText="Vote" locationPath="/vote" title={proposal?.name || ''} />
        <ProposalPanel>
          <Typography variant="h2" mb="20px">
            {proposal?.name}
          </Typography>
          <Flex alignItems="center" mb="22px">
            <ProposalStatusIcon
              status={proposal?.status === undefined ? '' : proposal?.status}
              startDay={proposal?.status === undefined ? 0 : proposal?.startDay}
              endDay={proposal?.status === undefined ? 0 : proposal?.startDay}
            />
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
          <StatsContainer>
            <Column sx={{ flexGrow: '1' }}>
              <Progress>
                <ProgressBar percentage={`${proposal?.for}`} type={'Approve'} />
              </Progress>
            </Column>
            <Column sx={{ textAlign: 'right' }}>
              <Button ml="20px" width="150px" onClick={() => setIsApproveModalVisible(true)}>
                Approve
              </Button>
            </Column>
          </StatsContainer>
          <Flex alignItems="center">
            <Typography fontWeight="bold" variant="p" mr="5px">
              Reject
            </Typography>
            <Typography opacity="0.85" mr="5px" fontWeight="bold">
              {proposal?.against}%
            </Typography>
          </Flex>
          <StatsContainer>
            <Column sx={{ flexGrow: '1' }}>
              <Progress>
                <ProgressBar percentage={`${proposal?.against}`} type={'Reject'} />
              </Progress>
            </Column>
            <Column sx={{ textAlign: 'right', justifyContent: 'center' }}>
              <AlertButton ml="20px" width="150px" color="red" onClick={() => setIsRejectModalVisible(true)}>
                Reject
              </AlertButton>
            </Column>
          </StatsContainer>
          <ProposalModal
            isOpen={isApproveModalVisible}
            toggleOpen={setIsApproveModalVisible}
            balnWeight={proposal?.for}
            type={'Approve'}
          />
          <ProposalModal
            isOpen={isRejectModalVisible}
            toggleOpen={setIsRejectModalVisible}
            balnWeight={proposal?.against}
            type={'Reject'}
          />
        </ProposalPanel>
        <ProposalPanel>
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
        </ProposalPanel>
      </ProposalContainer>
    </DefaultLayout>
  );
}
