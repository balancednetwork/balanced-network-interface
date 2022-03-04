import dayjs from 'dayjs';

const LAUNCH_DATE = dayjs('04-26-2021');

export const formatTimeStr = (targetDay: number) => {
  const targetDateUTC = LAUNCH_DATE.utc().add(targetDay, 'days').hour(17);
  const nowUTC = dayjs().utc();
  const timeDiff = targetDateUTC.diff(nowUTC, 'milliseconds');
  const toHours = 1000 * 60 * 60;

  if (timeDiff > 0) {
    const moduloHoursleft = Math.floor(timeDiff / toHours) % 24;
    const daysLeft = Math.floor(timeDiff / toHours / 24);

    if (daysLeft) {
      const hoursLeftString =
        moduloHoursleft === 0 ? '' : moduloHoursleft === 1 ? 'an hour' : moduloHoursleft + ' hours';
      const daysLeftString = daysLeft === 1 ? '1 day' : daysLeft + ' days';
      return daysLeftString + (hoursLeftString ? ' and ' + hoursLeftString : hoursLeftString);
    } else {
      return targetDateUTC.from(nowUTC, true) === 'a day' ? '1 day' : targetDateUTC.from(nowUTC, true);
    }
  } else {
    return '';
  }
};
