import React from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import { Flex } from 'rebass/styled-components';

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
  Succeeded: 'Approved',
  'No Quorum': 'Quorum not reached',
  Executed: 'Enacted',
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

  let startTimeStr = platformDay
    ? dayjs()
        .utc()
        .add(startDay - platformDay, 'day')
        .hour(17)
        .fromNow(true)
    : '';

  const endTimeStr = () => {
    if (platformDay) {
      const endTime = dayjs()
        .utc()
        .add(endDay - platformDay - 1, 'day')
        .hour(17);

      const timeLeft = endTime.diff(dayjs().utc(), 'hours');
      const hours = timeLeft % 24;
      const days = Math.floor(timeLeft / 24);

      return days <= 1 ? endTime.fromNow(true) : `${days} days, ${hours} hours`;
    }
    return '';
  };

  const isActive = platformDay ? startDay <= platformDay && platformDay < endDay : false;

  if (status === 'Defeated' || status === 'No Quorum' || status === 'Failed Executed' || status === 'Cancelled') {
    return (
      <Flex alignItems="center" sx={{ columnGap: '10px' }}>
        <FailureIcon height="22" width="22" />
        <Typography variant="content" color="white">
          {StatusMap[status]}
        </Typography>
      </Flex>
    );
  }

  if (status === 'Pending' || status === 'Confirmed') {
    return (
      <Flex alignItems="center" sx={{ columnGap: '10px' }}>
        <CalendarIcon height="22" width="22" />
        <Typography variant="content" color="white">
          {`Starting in ${startTimeStr}`}
        </Typography>
      </Flex>
    );
  }

  if (status === 'Active') {
    if (isActive) {
      return (
        <Flex alignItems="center" sx={{ columnGap: '10px' }}>
          <CalendarIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {`${endTimeStr()} left`}
          </Typography>
        </Flex>
      );
    } else {
      return (
        <Flex alignItems="center" sx={{ columnGap: '10px' }}>
          <CalendarIcon height="22" width="22" />
          <Typography variant="content" color="white">
            {`Starting in ${startTimeStr}`}
          </Typography>
        </Flex>
      );
    }
  }

  if (status === 'Succeeded' || status === 'Executed') {
    return (
      <Flex alignItems="center" sx={{ columnGap: '10px' }}>
        <TickIcon height="22" width="22" />
        <Typography variant="content" color="white">
          {StatusMap[status]}
        </Typography>
      </Flex>
    );
  }
  return (
    <Flex alignItems="center">
      <Typography variant="content" color="white">
        {StatusMap[status]}
      </Typography>
    </Flex>
  );
}
