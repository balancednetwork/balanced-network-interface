import axios from 'axios';
import { Converter } from 'icon-sdk-js';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { RPC_DEBUG_ENDPOINT } from 'hooks/useCxApi';
import {
  ArbitraryCall,
  ArbitraryCallParameter,
  ArbitraryCallParameterType,
  EditableArbitraryCall,
} from 'store/arbitraryCalls/reducer';

export function getTransactionsString(transactions: EditableArbitraryCall[]): string {
  const formatted = transactions.map(transaction => {
    const formattedTx: ArbitraryCall = {
      address: transaction.contract as string,
      method: transaction.method as string,
    };

    if (transaction.parameters) {
      formattedTx.parameters = transaction.parameters.map(parameter => {
        if (parameter.type === '[]struct') {
          const structValue = (parameter.value as { [key: string]: ArbitraryCallParameter }[]).map(item => {
            const fieldNames = Object.keys(item);
            const values = {};

            fieldNames.forEach(fieldName => {
              values[fieldName] = {
                value: item[fieldName].value as string,
                type: mappedParamTypes[item[fieldName].type as ArbitraryCallParameterType],
              };
            });
            return values;
          });
          return {
            value: structValue,
            type: mappedParamTypes['[]struct'],
          } as ArbitraryCallParameter;
        } else {
          return {
            value: parameter.value,
            type: mappedParamTypes[parameter.type as ArbitraryCallParameterType],
          } as ArbitraryCallParameter;
        }
      });
    }

    return formattedTx;
  });
  return JSON.stringify(formatted);
}

const mappedParamTypes: { [key in ArbitraryCallParameterType]: string } = Object.freeze({
  Address: 'Address',
  bytes: 'bytes',
  str: 'String',
  int: 'int',
  bool: 'bool',
  struct: 'Struct',
  '[]Address': 'Address[]',
  '[]int': 'int[]',
  '[]str': 'str[]',
  '[]bool': 'bool[]',
  '[]struct': 'Struct[]',
});

const debugStepEstimateParams = {
  jsonrpc: '2.0',
  method: 'debug_invokeTransaction',
  id: 1235,
  params: {
    version: '0x3',
    from: '',
    to: bnJs.Governance.address,
    value: '0x0',
    timestamp: '',
    nid: Converter.toHex(NETWORK_ID),
    nonce: '0x1',
    data: {
      method: 'defineVote',
      params: {},
    },
  },
};

export async function tryExecuteWithTransactionsString(
  account: string | null | undefined,
  txsString: string,
  proposalData: {
    title: string;
    description: string;
    duration: string;
    forumLink: string;
    platformDay: number | undefined;
  },
) {
  if (account && proposalData.platformDay) {
    const params = { ...debugStepEstimateParams };
    params.params.timestamp = Converter.toHex(new Date().getTime() * 1000);
    params.params.data.params = {
      name: proposalData.title,
      description: proposalData.description,
      vote_start: Converter.toHex(proposalData.platformDay + 1),
      duration: Converter.toHex(parseInt(proposalData.duration)),
      forumLink: proposalData.forumLink,
      transactions: txsString,
    };
    params.params.from = account;
    console.log('test params:', params);
    const response = await axios.post(RPC_DEBUG_ENDPOINT, params);
    console.log(response);

    return { query: params, response };
  } else {
    return { error: 'Login first' };
  }
}
