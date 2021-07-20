import React, { useState } from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Breadcrumb } from 'app/components/Breadcrumb';
import { Button, AlertButton } from 'app/components/Button';
import { Column } from 'app/components/Column';
import { DefaultLayout } from 'app/components/Layout';
import { ProposalModal } from 'app/components/ProposalModal';
import { theme, Typography } from 'app/theme';
import { ReactComponent as CalendarIcon } from 'assets/icons/calendar.svg';
import { ReactComponent as ExternalIcon } from 'assets/icons/external.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';

dayjs.extend(duration);
const themes = theme();
const title = 'Distribute more BALN to the DAO fund by reducing the BALN for loans and liquidity pools.';
const content = `
Too much income is being given back to people who use Balanced. While incentivization is good, we need to prevent Balanced from becoming a platform that people use purely to earn rewards.\nTo make sure Balanced has enough income in its treasury to cover ongoing costs, like security audits, a higher bug bounty, marketing initiatives, projects that utilize Balanced’s functionality, and so on, we should redirect some of the BALN allocated to borrowers and liquidity providers to the DAO fund instead.
`;

const metadata = {
  voted: 16,
  voters: 748,
  approvePercentage: 53,
  rejectPercentage: 14,
  timestamp: 284400000,
};

const balnWeight = 2500.12345;

const data = {
  title,
  content,
  metadata,
  balnWeight,
};

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
    (props.type === 'Approve' && themes.colors.primary) || (props.type === 'Reject' && themes.colors.alert)};
  height: 100%;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  transition: width 0.2s ease-in;
  justify-content: center;
  width: ${props => `${props.percentage}%`};
`;

export function ProposalPage() {
  // Fetch proposal page based on proposal id
  const fetchedData = data;
  const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  return (
    <DefaultLayout title="Vote">
      <Helmet>
        <title>Vote</title>
      </Helmet>
      <ProposalContainer>
        <Breadcrumb locationText="Vote" locationPath="/vote" title={title} />
        <ProposalPanel>
          <Typography variant="h2" mb="20px">
            {title}
          </Typography>
          <Flex alignItems="center" mb="22px">
            <CalendarIcon height="22" width="22" style={{ marginRight: '5px' }} />
            <Typography variant="content" color="white" mr="20px">
              {`${Math.floor(dayjs.duration(fetchedData?.metadata?.timestamp).asDays())} days, ${
                dayjs.duration(fetchedData?.metadata?.timestamp).asHours() % 24
              } hours left`}
            </Typography>
            <PieChartIcon height="22" width="22" style={{ marginRight: '5px' }} />
            <Typography variant="content" color="white" mr="20px">
              {`${fetchedData?.metadata?.voted} voted`}
            </Typography>
            <UserIcon height="22" width="22" style={{ marginRight: '5px' }} />
            <Typography variant="content" color="white" mr="20px">
              {`${fetchedData?.metadata?.voters} voters`}
            </Typography>
          </Flex>
          <Flex alignItems="center">
            <Typography fontWeight="bold" variant="p" mr="5px">
              Approve
            </Typography>
            <Typography opacity="0.85" mr="5px" fontWeight="bold">
              {fetchedData?.metadata?.approvePercentage}%
            </Typography>
            <Typography opacity="0.85" fontWeight="bold">
              (67% required)
            </Typography>
          </Flex>
          <StatsContainer>
            <Column sx={{ flexGrow: '1' }}>
              <Progress>
                <ProgressBar percentage={`${fetchedData?.metadata?.approvePercentage}`} type={'Approve'} />
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
              {fetchedData?.metadata?.rejectPercentage}%
            </Typography>
          </Flex>
          <StatsContainer>
            <Column sx={{ flexGrow: '1' }}>
              <Progress>
                <ProgressBar percentage={`${fetchedData?.metadata?.rejectPercentage}`} type={'Reject'} />
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
            balnWeight={fetchedData?.balnWeight}
            type={'Approve'}
          />
          <ProposalModal
            isOpen={isRejectModalVisible}
            toggleOpen={setIsRejectModalVisible}
            balnWeight={fetchedData?.balnWeight}
            type={'Reject'}
          />
        </ProposalPanel>
        <ProposalPanel>
          <Typography variant="h2" mb="20px">
            Description
          </Typography>
          <Typography variant="p" mb="20px">
            {fetchedData?.content}
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
