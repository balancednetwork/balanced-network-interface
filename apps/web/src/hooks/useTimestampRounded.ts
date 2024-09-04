export default function useTimestampRounded(period = 1000 * 60, daysBack = 0) {
  const now = Math.floor(new Date().getTime() / period) * period;
  return now - daysBack * 24 * 60 * 60 * 1000;
}
