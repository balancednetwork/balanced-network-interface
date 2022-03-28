import { BSC_NODE, signingActions, getCurrentICONexNetwork } from 'btp/src/connectors/constants';
import { connectedNetWorks, PAIRED_NETWORKS, pairedNetworks } from 'btp/src/utils/constants';
import { IconUtil, IconConverter, IconBuilder } from 'icon-sdk-js';

import * as ICONService from '../ICONServices';
import { transfer } from '../transfer';
import { convertToLoopUnit } from '../utils';

const { CallTransactionBuilder } = IconBuilder;
const { serialize } = IconUtil;

jest.mock('store', () => {
  return {
    dispatch: {
      modal: {
        isICONexWalletConnected: jest.fn().mockImplementation(() => true),
        openModal: jest.fn(),
      },
    },
  };
});

describe('ICONService', () => {
  test('signTx', () => {
    const transactions = { from: 'alice', to: 'bob', value: 1 };
    const options = {
      builder: new CallTransactionBuilder(),
      method: 'transfer',
      params: { _coinName: 'DEV' },
      nid: '0x58eb1c',
      timestamp: '123',
    };

    const txBuilder = new CallTransactionBuilder();

    const tx = txBuilder
      .from(transactions.from)
      .to(transactions.to)
      .stepLimit(IconConverter.toBigNumber(getCurrentICONexNetwork().stepLimit))
      .nid(IconConverter.toBigNumber(options.nid))
      .nonce(IconConverter.toBigNumber(1))
      .version(IconConverter.toBigNumber(3))
      .timestamp(options.timestamp)
      .value(convertToLoopUnit(transactions.value))
      .method(options.method)
      .params(options.params)
      .build();

    const rawTx = IconConverter.toRawTransaction(tx);
    const hash = serialize(rawTx);

    const result = ICONService.signTx(transactions, options);

    expect(result).toBe(hash);
  });

  describe('transfer', () => {
    test('send native coin on BSC side', () => {
      const network = connectedNetWorks.bsc;
      const mock_sendNativeCoin = jest.spyOn(ICONService, 'sendNativeCoin').mockImplementation();

      transfer({}, true, network);

      expect(mock_sendNativeCoin).toBeCalledTimes(1);
      expect(mock_sendNativeCoin.mock.calls[0][1]).toBe(BSC_NODE.networkAddress);
      expect(window[signingActions.globalName]).toBe(signingActions.transfer);
    });

    test('send non-native coin on BSC side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-BSC']);
      const mock_depositTokensIntoBSH = jest.spyOn(ICONService, 'depositTokensIntoBSH').mockImplementation();

      transfer(null, null, connectedNetWorks.bsc, false);

      expect(mock_depositTokensIntoBSH).toBeCalledTimes(1);
    });

    test('send non-native coin on Moonbeam side', () => {
      localStorage.setItem(PAIRED_NETWORKS, pairedNetworks['ICON-Moonbeam']);
      const mock_sendNonNativeCoin = jest.spyOn(ICONService, 'setApproveForSendNonNativeCoin').mockImplementation();

      transfer({}, null, connectedNetWorks.moonbeam, false);

      expect(mock_sendNonNativeCoin).toBeCalledTimes(1);
    });
  });
});
