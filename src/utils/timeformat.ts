import dayjs from 'dayjs';

export const formatTimeStr = (targetDay, platformDay, isStartTime?: boolean) => {
  const targetDate = dayjs()
    .utc()
    .add(targetDay - platformDay - (isStartTime ? 0 : 1), 'day')
    .hour(17);

  const hoursDiff = targetDate.diff(dayjs().utc(), 'hours');

  if (hoursDiff < 0) return '';

  const hoursLeft = hoursDiff % 24;
  const daysLeft = Math.floor(hoursDiff / 24);

  if (daysLeft < 1) return targetDate.fromNow(true);

  const hoursLeftString = hoursLeft === 0 ? '' : hoursLeft === 1 ? 'an hour' : hoursLeft + ' hours';
  const daysLeftString = daysLeft === 1 ? 'a day' : daysLeft + ' days';

  return daysLeftString + (hoursLeftString ? ', ' + hoursLeftString : hoursLeftString);
};
