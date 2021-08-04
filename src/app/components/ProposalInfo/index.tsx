import React from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import { ProposalInterface } from 'types';
import { normalizeContent } from 'utils';

dayjs.extend(duration);

const ProposalWrapper = styled.div`
  border-radius: 10px;
  flex: 1;
  width: 100%;
  background: #144a68;
  border: 2px solid #144a68;
  padding: 20px 25px;
  transition: border 0.3s ease;
  outline: none;
  overflow: visible;
  margin: 0 0 25px;
  cursor: pointer;

  :hover,
  :focus {
    border: 2px solid #2ca9b7;
  }
`;
const ApprovalSwatch = styled(Box)`
  background: #2ca9b7;
  height: 20px;
  width: 20px;
  border-radius: 5px;
`;
const RejectionSwatch = styled(Box)`
  background: #fb6a6a;
  height: 20px;
  width: 20px;
  border-radius: 5px;
`;
const Divider = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 15px;
`;
const ContentText = styled(Typography)`
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 15px;
  font-size: 16px;
`;

export default function ProposalInfo({ proposal }: { proposal: ProposalInterface }) {
  const {
    name: title,
    description,
    startDay,
    endDay,
    status,
    for: approvePercentage,
    against: rejectPercentage,
    uniqueApproveVoters,
    uniqueRejectVoters,
  } = proposal;

  return (
    <ProposalWrapper>
      <Typography variant="h3" mb="10px">
        {title}
      </Typography>
      <ContentText>{description && normalizeContent(description)}</ContentText>
      <Divider />
      <Flex alignItems="center" flexWrap="wrap" sx={{ columnGap: '15px' }}>
        <ProposalStatusIcon status={status} startDay={startDay} endDay={endDay} />

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <PieChartIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {`${approvePercentage + rejectPercentage}% voted`}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <UserIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {`${uniqueApproveVoters + uniqueRejectVoters} voters`}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <ApprovalSwatch />
          <Typography variant="content" color="white">
            {`${approvePercentage}%`}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <RejectionSwatch />
          <Typography variant="content" color="white">
            {`${rejectPercentage}%`}
          </Typography>
        </Flex>
      </Flex>
    </ProposalWrapper>
  );
}
