export function numberWithCommas(value) {
  return parseInt(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function getDigit(value) {
  return (value % 1).toFixed(2).substring(2);
}

export function formatWalletAddress(value) {
  if (value !== null) {
    return value.substring(0, 6) + '...' + value.substring(value.length - 6);
  } else {
    return '';
  }
}
