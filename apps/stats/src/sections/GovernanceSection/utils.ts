import dayjs from 'dayjs';

import { LAUNCH_DAY, ONE_DAY_DURATION } from '@/utils';

const beginFrom = dayjs(LAUNCH_DAY - ONE_DAY_DURATION);

export const formatTimeStr = (targetDay: number) => {
  const targetDateUTC = beginFrom.utc().add(targetDay, 'days').hour(17);
  const nowUTC = dayjs().utc();
  const timeDiff = targetDateUTC.diff(nowUTC, 'milliseconds');

  if (timeDiff > 0) {
    const toMinutes = 1000 * 60;
    const toHours = toMinutes * 60;
    const toDays = toHours * 24;
    const daysLeft = Math.floor(timeDiff / toDays);
    const hoursLeft = Math.floor(timeDiff / toHours) % 24;
    const minutesLeft = Math.floor(timeDiff / toMinutes) % 60;
    const formattedString = `${daysLeft ? daysLeft + 'd ' : ''}${hoursLeft ? hoursLeft + 'h ' : ''}${
      minutesLeft ? minutesLeft + 'm' : ''
    }`;

    return formattedString || 'less then a minute';
  } else {
    return '';
  }
};

export const getDateFromDay = (day: number) => {
  return beginFrom.add(day, 'days').hour(17);
};

export const normalizeContent = (text: string, short: boolean = false): string => {
  const regex = /[\n\r]/g;
  const t = text.replaceAll(regex, ' ');
  return t.substring(0, short ? 100 : 248) + '...';
};
