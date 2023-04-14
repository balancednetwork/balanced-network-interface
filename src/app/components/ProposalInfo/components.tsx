import React from 'react';

import { Trans } from '@lingui/macro';
import Skeleton from '@material-ui/lab/Skeleton';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { ProposalStatusIcon } from 'app/components/ProposalStatusIcon';
import { Typography } from 'app/theme';
import { ReactComponent as CalendarIcon } from 'assets/icons/calendar.svg';
import { ReactComponent as PieChartIcon } from 'assets/icons/pie-chart.svg';
import { ReactComponent as UserIcon } from 'assets/icons/users.svg';
import { ProposalInterface } from 'types';
import { getDateFromDay } from 'utils/timeformat';

dayjs.extend(duration);

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

export const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
`;

export const IconLabel = ({ icon, content }: { icon: React.ReactNode; content: React.ReactNode }) => {
  return (
    <Flex alignItems="center" sx={{ columnGap: '10px', lineHeight: '35px' }}>
      <>{icon}</>
      <>{content}</>
    </Flex>
  );
};

export const VoteStatusLabel = ({ proposal }: { proposal?: ProposalInterface }) => {
  return (
    <div>
      {proposal?.status && proposal?.startDay && proposal?.endDay ? (
        <ProposalStatusIcon status={proposal.status} startDay={proposal.startDay} endDay={proposal.endDay} />
      ) : (
        <Flex alignItems="center" sx={{ columnGap: '10px' }}>
          <StyledSkeleton animation="wave" width={22} variant="circle" />
          <StyledSkeleton animation="wave" width={80} />
        </Flex>
      )}
    </div>
  );
};

export const VoteDateEndLabel = ({ proposal }: { proposal?: ProposalInterface }) => {
  return proposal &&
    proposal.status !== 'Active' &&
    proposal.status !== 'Pending' &&
    proposal.status !== 'Cancelled' &&
    proposal.endDay ? (
    <IconLabel
      icon={<CalendarIcon height="22" width="22" />}
      content={
        <Typography lineHeight={1.4} color="text">
          {getDateFromDay(proposal.endDay).format('MMM DD YYYY')}
        </Typography>
      }
    />
  ) : null;
};

export const VoterPercentLabel = ({ value }: { value?: number }) => {
  return (
    <IconLabel
      icon={<PieChartIcon height="22" width="22" />}
      content={
        typeof value === 'number' ? (
          <Typography variant="content" color="white">
            <Trans>{value}% voted</Trans>
          </Typography>
        ) : (
          <StyledSkeleton animation="wave" width={80} />
        )
      }
    />
  );
};

export const VoterNumberLabel = ({ value }: { value?: number }) => {
  return (
    <IconLabel
      icon={<UserIcon height="22" width="22" />}
      content={
        typeof value === 'number' ? (
          <Typography variant="content" color="white">
            <Trans>{value || '-'} voters</Trans>
          </Typography>
        ) : (
          <StyledSkeleton animation="wave" width={80} />
        )
      }
    />
  );
};

export const ApprovalLabel = ({ value }: { value?: number }) => {
  return (
    <IconLabel
      icon={<ApprovalSwatch />}
      content={
        typeof value === 'number' ? (
          <Typography variant="content" color="white">
            {value}%
          </Typography>
        ) : (
          <StyledSkeleton animation="wave" width={40} />
        )
      }
    />
  );
};

export const RejectionLabel = ({ value }: { value?: number }) => {
  return (
    <IconLabel
      icon={<RejectionSwatch />}
      content={
        typeof value === 'number' ? (
          <Typography variant="content" color="white">
            {value}%
          </Typography>
        ) : (
          <StyledSkeleton animation="wave" width={40} />
        )
      }
    />
  );
};
