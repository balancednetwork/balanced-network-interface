import axios from 'axios';
import querystring from 'querystring';

import { API_V1_ENDPOINT } from './constants';

export type Transaction = {
  block_hash: string;
  block_number: number;
  block_timestamp: number;
  data: {
    method: string;
    params: {
      _value: string;
      _symbol: string;
    };
  };
  // data_type: 'call';
  // fee: null;
  // from_address: 'hx042cf74867d4d450fb8b80a11ed5426cd33fa29e';
  // hash: '0x0dca5c02c2fa5f7ec61c16d19c478110eaacb2c8cad475bf3c1405cd215f528a';
  item_id: string;
  // item_timestamp: '2021-06-01T02:33:24Z';
  // method: 'withdrawCollateral';
  // nid: 1;
  // nonce: null;
  // receipt_cumulative_step_used: '0x8e5f8';
  // receipt_logs: null;
  // receipt_score_address: null;
  // receipt_status: 1;
  // receipt_step_price: '0x2e90edd00';
  // receipt_step_used: '0x69118';
  // signature: 'DEautR9WDi2EKa0oASPzhENqiOTkoEiV2bscTVdlW4Vb39ObAqy3l/MSx21cTjIbjLN5VybMzPc4PPkuzxEYKgA=';
  // step_limit: '0x2faf080';
  // timestamp: '0x5c3ab29c06d70';
  // to_address: 'cx66d4d90f5f113eba575bf793570135f9b10cece1';
  // transaction_index: 2;
  // type: 'transaction';
};

export const getLoanTransation = async (
  params: { skip: number; limit: number; [key: string]: any } = {
    skip: 0,
    limit: 10,
  },
): Promise<Transaction[]> => {
  params.min_block_number = -1;
  params.max_block_number = -1;

  const endpoint = `${API_V1_ENDPOINT}/loans/transactions?${querystring.stringify(params)}`;

  return axios(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  }).then(res => res.data);
};
