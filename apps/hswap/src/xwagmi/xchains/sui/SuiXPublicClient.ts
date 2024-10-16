import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';
import { TransactionStatus, XCallEvent, XTransactionInput, XTransactionType } from '../../xcall/types';
import { SuiXService } from './SuiXService';
import { addressesMainnet, XCALL_FEE_AMOUNT } from './SuiXWalletClient';
import { bcs } from '@mysten/sui/bcs';
import { Transaction } from '@mysten/sui/transactions';
import { toBytes } from 'viem';
import { isNativeCurrency } from '@/constants/tokens';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';
import { getRlpEncodedSwapData } from '@/xwagmi/xcall/utils';

export class SuiXPublicClient extends XPublicClient {
  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  getPublicClient(): any {
    return this.getXService().suiClient;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeXToken()) {
      const balance = await this.getPublicClient().getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      return CurrencyAmount.fromRawAmount(xToken, balance.totalBalance);
    } else {
      const balance = await this.getPublicClient().getBalance({
        owner: address,
        coinType: xToken.address,
      });
      return CurrencyAmount.fromRawAmount(xToken, balance.totalBalance);
    }
  }

  // TODO: implement this using suiClient.getAllBalances
  // async getBalances(address: string | undefined, xTokens: XToken[]) {
  // }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    // TODO: hardcoded for now, confirm with the team
    return BigInt(110_000_000);
  }

  async getBlockHeight() {
    return BigInt(0); // not used
  }

  async getTxReceipt(txHash: string) {
    const res = await this.getPublicClient().getTransactionBlock({
      digest: txHash,
      options: {
        showRawInput: true,
        showEffects: true,
      },
    });
    return res;
  }

  deriveTxStatus(rawTx): TransactionStatus {
    if (rawTx) {
      if (rawTx.effects.status.status === 'success') {
        return TransactionStatus.success;
      } else {
        return TransactionStatus.failure;
      }
    }
    return TransactionStatus.pending;
  }

  getTxEventLogs(rawTx) {
    return []; // not used
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    return []; // not used
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    return []; // not used
  }

  needsApprovalCheck(xToken: XToken): boolean {
    return false;
  }

  async estimateApproveGas(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    return 0n;
  }

  async estimateSwapGas(xTransactionInput: XTransactionInput) {
    // TODO: implement
    console.log('estimateSwapGas', xTransactionInput);

    const { type, executionTrade, account, direction, inputAmount, recipient, slippageTolerance, xCallFee } =
      xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const receiver = `${direction.to}/${recipient}`;

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
      data = rlpEncodedData;
    } else if (type === XTransactionType.BRIDGE) {
      data = toBytes(
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

    console.log('AAAAA');

    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';
    const amount = BigInt(inputAmount.quotient.toString());

    let txResult;
    try {
      if (isNativeCurrency(inputAmount.currency)) {
        const txb = new Transaction();

        const [depositCoin, feeCoin] = txb.splitCoins(txb.gas, [amount, XCALL_FEE_AMOUNT]);
        txb.moveCall({
          target: `${addressesMainnet['Balanced Package Id']}::asset_manager::deposit`,
          arguments: [
            txb.object(addressesMainnet['Asset Manager Storage']),
            txb.object(addressesMainnet['xCall Storage']),
            txb.object(addressesMainnet['xCall Manager Storage']),
            feeCoin,
            depositCoin,
            txb.pure(bcs.vector(bcs.string()).serialize([destination])),
            txb.pure(bcs.vector(bcs.vector(bcs.u8())).serialize([data])),
          ],
          typeArguments: ['0x2::sui::SUI'],
        });

        txResult = await this.getXService().suiClient.dryRunTransactionBlock({
          transactionBlock: txb,
        });
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

        const [depositCoin] = txb.splitCoins(coins[0].coinObjectId, [amount]);
        const [feeCoin] = txb.splitCoins(txb.gas, [XCALL_FEE_AMOUNT]);

        txb.moveCall({
          target: `${addressesMainnet['Balanced Package Id']}::balanced_dollar_crosschain::cross_transfer`,
          arguments: [
            txb.object(addressesMainnet['bnUSD Storage']),
            txb.object(addressesMainnet['xCall Storage']),
            txb.object(addressesMainnet['xCall Manager Storage']),
            feeCoin,
            depositCoin,
            txb.pure(bcs.string().serialize(destination)),
            txb.pure(bcs.vector(bcs.vector(bcs.u8())).serialize([data])),
          ],
          // typeArguments: [],
        });

        txResult = await this.getXService().suiClient.dryRunTransactionBlock({
          transactionBlock: txb,
        });
      } else {
        throw new Error('Only native token and bnUSD are supported');
      }
    } catch (e) {
      console.log(e);
    }

    console.log('BBBBB', txResult);

    return 0n;
  }
}
