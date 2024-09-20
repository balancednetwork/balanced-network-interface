import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID, NATIVE_ADDRESS } from '@/xwagmi/constants';

import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { showMessageOnBeforeUnload } from '@/xwagmi/utils';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { toHex } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { SuiXService } from './SuiXService';

const addressesMainnet = {
  'Balanced Package Id': '0x52af654cd5f58aaf99638d71fd46896637abff823a9c6e152a297b9832a7ee72',
  'xCall Package Id': '0x3638b141b349173a97261bbfa33ccd45334d41a80584db6f30429e18736206fe',
  'xCall Storage': '0xe9ae3e2d32cdf659ad5db4219b1086cc0b375da5c4f8859c872148895a2eace2',
  'xCall Manager Id': '0xa1fe210d98fb18114455e75f241ab985375dfa27720181268d92fe3499a1111e',
  'xCall Manager Storage': '0x1bbf52529d14124738fac0abc1386670b7927b6d68cab7f9bd998a0c0b274042',
  'Asset Manager Id': '0x1c1795e30fbc0b9c18543527940446e7601f5a3ca4db9830da4f3c68557e1fb3',
  'Asset Manager Storage': '0x25c200a947fd16903d9daea8e4c4b96468cf08d002394b7f1933b636e0a0d500',
  'bnUSD Id': '0xa2d713bd53ccb8855f9d5ac8f174e07450f2ff18e9bbfaa4e17f90f28b919230',
  'bnUSD Storage': '0xd28c9da258f082d5a98556fc08760ec321451216087609acd2ff654d9827c5b5',
};

export class SuiXWalletClient extends XWalletClient {
  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransaction(xTransactionInput: XTransactionInput, options) {
    const { signTransaction } = options;
    if (!signTransaction) {
      throw new Error('signTransaction is required');
    }

    const { type, executionTrade, account, direction, inputAmount, recipient, slippageTolerance, xCallFee } =
      xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const receiver = `${direction.to}/${recipient}`;

    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

      // data = toHex(
      //   JSON.stringify({
      //     method: '_swap',
      //     params: {
      //       path: executionTrade.route.pathForSwap,
      //       receiver: receiver,
      //       minimumReceive: minReceived.quotient.toString(),
      //     },
      //   }),
      // );

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived).toString('hex');
      data = `0x${rlpEncodedData}`;
    } else if (type === XTransactionType.BRIDGE) {
      data = toHex(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: receiver,
          },
        }),
      );
    } else {
      throw new Error('Invalid XTransactionType');
    }

    const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txResult;
    if (isNative) {
      const txb = new Transaction();

      const [depositCoin, feeCoin] = txb.splitCoins(txb.gas, [8_000_000, 1_000_000_000]);
      txb.moveCall({
        target: `${addressesMainnet['Balanced Package Id']}::asset_manager::deposit`,
        arguments: [
          txb.object(addressesMainnet['Asset Manager Storage']),
          txb.object(addressesMainnet['xCall Storage']),
          txb.object(addressesMainnet['xCall Manager Storage']),
          feeCoin,
          depositCoin,
          txb.pure(bcs.vector(bcs.string()).serialize([destination])),
          txb.pure(bcs.vector(bcs.string()).serialize(['0x'])),
        ],
        typeArguments: ['0x2::sui::SUI'],
      });

      const { bytes, signature, reportTransactionEffects } = await signTransaction({
        transaction: txb,
      });

      txResult = await this.getXService().suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
        },
      });

      // Always report transaction effects to the wallet after execution
      // @ts-ignore
      reportTransactionEffects(txResult.rawEffects!);
    } else if (isBnUSD) {
      const coins = (
        await this.getXService().suiClient.getCoins({
          owner: account,
          coinType: inputAmount.currency.wrapped.address,
        })
      )?.data;

      const txb = new Transaction();

      if (!coins || coins.length === 0) {
        throw new Error('No coins found');
      } else if (coins.length > 1) {
        await txb.mergeCoins(
          coins[0].coinObjectId,
          coins.slice(1).map(coin => coin.coinObjectId),
        );
      }

      const [depositCoin] = txb.splitCoins(coins[0].coinObjectId, [100_000_000]);
      const [feeCoin] = txb.splitCoins(txb.gas, [1_000_000_000]);

      txb.moveCall({
        target: `${addressesMainnet['Balanced Package Id']}::balanced_dollar_crosschain::cross_transfer`,
        arguments: [
          txb.object(addressesMainnet['bnUSD Storage']),
          txb.object(addressesMainnet['xCall Storage']),
          txb.object(addressesMainnet['xCall Manager Storage']),
          feeCoin,
          depositCoin,
          txb.pure(bcs.string().serialize(destination)),
          txb.pure(bcs.vector(bcs.string()).serialize([''])),
        ],
        // typeArguments: [],
      });

      const { bytes, signature, reportTransactionEffects } = await signTransaction({
        transaction: txb,
      });

      txResult = await this.getXService().suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
        },
      });

      // Always report transaction effects to the wallet after execution
      // @ts-ignore
      reportTransactionEffects(txResult.rawEffects!);
    } else {
      throw new Error('Only native token and bnUSD are supported');
    }

    const { digest: hash } = txResult || {};

    if (hash) {
      return hash;
    }
  }
}
