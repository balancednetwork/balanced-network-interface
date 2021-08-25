import dayjs from 'dayjs';

export const formatTimeStr = (targetDay, platformDay, type: 'end' | 'start') => {
  const isStart = type === 'start';
  const targetTime = dayjs()
    .utc()
    .add(targetDay - platformDay - (isStart ? 0 : 1), 'day')
    .hour(17);
  const timeLeft = targetTime.diff(dayjs().utc(), 'hours');

  if (timeLeft < 0) return '';
  if (isStart) return targetTime.fromNow(true);

  const hours = timeLeft % 24;
  const days = Math.floor(timeLeft / 24);

  return days < 1
    ? targetTime.fromNow(true)
    : `${days === 1 ? 'a day' : `${days} days`}${hours > 0 ? ', ' : ''}${
        hours > 0 ? (hours === 1 ? 'an hour' : hours) : ''
      }${hours > 1 ? ' hours' : ''}`;
};
