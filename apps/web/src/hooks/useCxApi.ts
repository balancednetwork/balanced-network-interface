import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios, { AxiosResponse } from 'axios';

import { NETWORK_ID } from '@/constants/config';

const RPC_ENDPOINT = CHAIN_INFO[NETWORK_ID].APIEndpoint;
export const RPC_DEBUG_ENDPOINT = CHAIN_INFO[NETWORK_ID].debugAPIEndpoint;

type ArbitraryCallParameterType =
  | 'Address'
  | 'bytes'
  | 'str'
  | 'int'
  | 'bool'
  | 'struct'
  | '[]Address'
  | '[]str'
  | '[]int'
  | '[]bool'
  | '[]struct';

const API_PARAMS = {
  id: new Date().getTime(),
  jsonrpc: '2.0',
  method: 'icx_getScoreApi',
  params: {},
};

export type CxMethodInput = {
  name: string;
  type: ArbitraryCallParameterType;
  fields?: CxMethodInput[];
};

export type CxMethod = {
  name: string;
  inputs: CxMethodInput[];
  readonly?: '0x1' | '0x0';
  type: 'function' | 'eventlog';
};

function isCxValid(cx: string) {
  return cx.length === 42 && cx.startsWith('cx');
}

export function useCxApi(cx: string | undefined) {
  return useQuery({
    queryKey: [`cxApi`, cx],
    queryFn: async () => {
      const params = { ...API_PARAMS, params: { address: cx } };
      const response: AxiosResponse<{ result: CxMethod[] }> = await axios.post(`${RPC_ENDPOINT}`, params);

      if (response.status === 200) {
        return response.data.result.filter(method => method.type === 'function' && method.readonly !== '0x1');
      }
    },
    enabled: !!cx && isCxValid(cx),
    placeholderData: keepPreviousData,
  });
}
