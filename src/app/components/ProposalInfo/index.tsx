import React from 'react';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
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
const ApprovalSwatch = styled.div`
  margin-right: 7px;
  background: #2ca9b7;
  height: 20px;
  width: 20px;
  border-radius: 5px;
`;
const RejectionSwatch = styled.div`
  margin-right: 7px;
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

export default function ProposalInfo(props) {
  const { title, content, metadata } = props;
  const {
    approvePercentage,
    rejectPercentage,
    uniqueApproveVoters,
    uniqueRejectVoters,
    status,
    endDay,
    startDay,
  } = metadata;

  return (
    <ProposalWrapper>
      <Typography variant="h3" mb="10px">
        {title}
      </Typography>
      <ContentText>{content !== '' && normalizeContent(content)}</ContentText>
      <Divider />
      <Flex alignItems="center">
        <ProposalStatusIcon status={status} startDay={startDay} endDay={endDay} />
        <PieChartIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {`${approvePercentage + rejectPercentage}% voted`}
        </Typography>
        <UserIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {`${uniqueApproveVoters + uniqueRejectVoters} voters`}
        </Typography>
        <ApprovalSwatch />
        <Typography variant="content" color="white" mr="20px">
          {`${approvePercentage}%`}
        </Typography>
        <RejectionSwatch />
        <Typography variant="content" color="white" mr="20px">
          {`${rejectPercentage}%`}
        </Typography>
      </Flex>
    </ProposalWrapper>
  );
}
