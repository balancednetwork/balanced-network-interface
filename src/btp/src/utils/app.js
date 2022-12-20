const isEmpty = obj => {
  if (!obj) return true;
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

const hashShortener = hashStr => {
  if (!hashStr) return '';
  const len = hashStr.length;
  if (len <= 20) {
    return hashStr;
  }

  return `${hashStr.substring(0, 6)}...${hashStr.substring(len - 4)}`;
};

export const roundNumber = (num, digit = 2) => {
  if (!num) return 0;
  return +(Math.round(num + `e+${digit}`) + `e-${digit}`);
};

/**
 * Separate number with ","
 * @param {number} number
 * @returns e.g. 100,000.
 */
const toSeparatedNumberString = number => {
  if (!number && number !== 0) return '';

  // prevent rounding and drop ending zero
  return number.toLocaleString(undefined, { minimumFractionDigits: 10 }).replace(/(\.0+|0+)$/, '');
};

const shortenNumber = num => {
  if (num === undefined) return 0;
  const intNum = (num + '').split('.')[0];
  const { length } = intNum;
  switch (true) {
    case length > 12:
      return toSeparatedNumberString(roundNumber(num / 1000000000000)) + ' T';
    case length > 9:
      return toSeparatedNumberString(roundNumber(num / 1000000000)) + ' B';
    case length > 6:
      return toSeparatedNumberString(roundNumber(num / 1000000)) + ' M';
    default:
      return toSeparatedNumberString(+num);
  }
};

export { isEmpty, hashShortener, shortenNumber, toSeparatedNumberString };
