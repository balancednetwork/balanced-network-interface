import { Granularity } from './types';

export const GRANULARITY_MILLISECONDS: { [key in Granularity]: number } = {
  daily: 86400000,
  weekly: 604800000,
  biweekly: 604800000 * 2,
  monthly: 2628000000,
};
