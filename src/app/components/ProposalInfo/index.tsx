import React from 'react';

import Skeleton from '@material-ui/lab/Skeleton';
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

import { notificationCSS } from '../home/wallets/utils';

dayjs.extend(duration);

const ProposalWrapper = styled.div<{ showNotification?: boolean }>`
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

  ${({ showNotification }) => showNotification && `${notificationCSS}`}

  &:before, &:after {
    left: 10px;
    top: 10px;
    background-color: ${({ theme }) => theme.colors.primaryBright};
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

export const StyledSkeleton = styled(Skeleton)`
  background-color: rgba(44, 169, 183, 0.2) !important;
`;

export default function ProposalInfo({
  proposal,
  showNotification,
}: {
  proposal?: ProposalInterface;
  showNotification?: boolean;
}) {
  const {
    id,
    name: title,
    description,
    startDay,
    endDay,
    status,
    for: approvePercentage,
    against: rejectPercentage,
    sum,
    voters,
  } = proposal || {};

  if (status === 'Cancelled') return null;

  return (
    <ProposalWrapper showNotification={showNotification}>
      <Typography variant="h3" mb="10px">
        {title ? title : <StyledSkeleton animation="wave" height={30} />}
      </Typography>
      <ContentText>
        {title ? description && normalizeContent(description) : <StyledSkeleton animation="wave" height={20} />}
      </ContentText>
      <Divider />
      <Flex alignItems="center" flexWrap="wrap" sx={{ columnGap: '15px' }}>
        {status && startDay && endDay ? (
          <ProposalStatusIcon status={status} startDay={startDay} endDay={endDay} />
        ) : (
          <>
            <StyledSkeleton animation="wave" width={22} height={22} variant="circle" />
            <StyledSkeleton animation="wave" width={80} />
          </>
        )}

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <PieChartIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {typeof sum === 'number' ? `${sum}% voted` : <StyledSkeleton animation="wave" width={80} />}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <UserIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {typeof voters === 'number' ? (
              id === 1 ? (
                `- voters`
              ) : (
                `${voters} voters`
              )
            ) : (
              <StyledSkeleton animation="wave" width={80} />
            )}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <ApprovalSwatch />
          <Typography variant="content" color="white">
            {typeof approvePercentage === 'number' ? (
              `${approvePercentage}%`
            ) : (
              <StyledSkeleton animation="wave" width={40} />
            )}
          </Typography>
        </Flex>

        <Flex alignItems="center" my={1} sx={{ columnGap: '10px' }}>
          <RejectionSwatch />
          <Typography variant="content" color="white">
            {typeof rejectPercentage === 'number' ? (
              `${rejectPercentage}%`
            ) : (
              <StyledSkeleton animation="wave" width={40} />
            )}
          </Typography>
        </Flex>
      </Flex>
    </ProposalWrapper>
  );
}
