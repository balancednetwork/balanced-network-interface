import axios, { AxiosResponse } from 'axios';

import { API_ENDPOINT } from 'queries/constants';

export const getHistoryBars = (
  pair: number,
  resolution: string,
  from: number,
  to: number,
): Promise<AxiosResponse<any>> => {
  return axios.get(
    `${API_ENDPOINT}/pools/series/${pair}/${getTimeResolutionForBalancedBE(resolution).toLowerCase()}/${from}/${to}`,
  );
};

const getTimeResolutionForBalancedBE = (tvResolutionString: string): string => {
  switch (tvResolutionString) {
    case '5':
      return '5m';
    case '15':
      return '15m';
    case '60':
      return '1h';
    case '240':
      return '4h';
    case '1D':
      return '1d';
    case '1W':
      return '1w';
    default:
      return '1h';
  }
};
