import axios from 'axios';

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
  '[]struct': 'Struct[]',
});

const debugStepEstimateParams = {
  jsonrpc: '2.0',
  method: 'debug_estimateStep',
  id: 1234,
  params: {
    version: '0x3',
    from: 'hx4ec7b10509274f5fcf0593edd4d2407f0085152e',
    to: 'cx44250a12074799e26fdeee75648ae47e2cc84219',
    value: '0x0',
    timestamp: '0x563a6cf330136',
    nid: '0x3',
    nonce: '0x1',
    data: {
      method: 'tryExecuteTransactions',
      params: {
        transactions: '',
      },
    },
  },
};

export async function tryExecuteWithTransactionsString(txsString) {
  const params = { ...debugStepEstimateParams };
  params.params.data.params.transactions = txsString;
  const response = await axios.post(RPC_DEBUG_ENDPOINT, params);
  console.log(response);
}
