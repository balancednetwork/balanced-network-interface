import React from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

import { Typography } from 'app/theme';
import { ReactComponent as CalendarIcon } from 'assets/icons/calendar.svg';
import { ReactComponent as FailureIcon } from 'assets/icons/failure.svg';
import { ReactComponent as TickIcon } from 'assets/icons/tick.svg';
import { usePlatformDayQuery } from 'queries/reward';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const StatusMap = {
  Pending: 'Pending',
  Active: 'Active',
  Cancelled: 'Cancelled',
  Defeated: 'Rejected',
  Succeeded: 'Approve',
  'No Quorum': 'Quorum not reached',
  Executed: 'Executed',
  'Failed Execution': 'Execution Failed',
};

interface ProposalStatusProps {
  status: string;
  startDay: number;
  endDay: number;
}

export function ProposalStatusIcon(props: ProposalStatusProps) {
  const { status, startDay, endDay } = props;
  const platformDayQuery = usePlatformDayQuery();
  const platformDay = platformDayQuery.data;

  let startTimeStr =
    (status === 'Pending' || status === 'Confirmed') && platformDay
      ? dayjs()
          .utc()
          .add(startDay - platformDay, 'day')
          .hour(17)
          .fromNow(true)
      : '';

  let endTimeStr =
    status === 'Active' && platformDay
      ? dayjs()
          .utc()
          .add(endDay - platformDay - 1, 'day')
          .hour(17)
          .fromNow(true)
      : '';

  if (status === 'Defeated' || status === 'No Quorum' || status === 'Failed Executed' || status === 'Cancelled') {
    return (
      <>
        <FailureIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {StatusMap[status]}
        </Typography>
      </>
    );
  }

  if ((status === 'Pending' || status === 'Confirmed') && startDay !== undefined && endDay !== undefined) {
    return (
      <>
        <CalendarIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {`Starting in ${startTimeStr}`}
        </Typography>
      </>
    );
  }

  if (status === 'Active') {
    return (
      <>
        <CalendarIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {`${endTimeStr} left`}
        </Typography>
      </>
    );
  }

  if (status === 'Succeeded' || status === 'Executed') {
    return (
      <>
        <TickIcon height="22" width="22" style={{ marginRight: '5px' }} />
        <Typography variant="content" color="white" mr="20px">
          {StatusMap[status]}
        </Typography>
      </>
    );
  }
  return (
    <Typography variant="content" color="white" mr="20px">
      {StatusMap[status]}
    </Typography>
  );
}
