import { bcs } from '@mysten/sui/bcs';
import { Transaction, type TransactionResult } from '@mysten/sui/transactions';
import { signAndExecuteTransaction, signTransaction } from '@mysten/wallet-standard';
import { stringToBytes } from 'viem';
import { SuiProvider, SwapOrder } from '../entities/index.js';
import type { ChainConfig, CreateIntentOrderPayload, Result, SuiChainConfig } from '../types.js';

export class SuiIntentService {
  private constructor() {}

  /**
   * Create SUI intent order
   * @param payload - Intent payload
   * @param fromChainConfig - SUI chain config
   * @param toChainConfig - Destination chain config
   * @param provider - SUI provider
   * @return string- Transaction hash
   */
  public static async createIntentOrder(
    payload: CreateIntentOrderPayload,
    fromChainConfig: SuiChainConfig,
    toChainConfig: ChainConfig,
    provider: SuiProvider,
  ): Promise<Result<string>> {
    try {
      const intent = new SwapOrder(
        0n,
        fromChainConfig.storageId,
        fromChainConfig.nid,
        toChainConfig.nid,
        payload.fromAddress,
        payload.toAddress,
        payload.token,
        payload.amount,
        payload.toToken,
        payload.toAmount,
        stringToBytes(JSON.stringify({ quote_uuid: payload.quote_uuid })),
      );

      const isNative = payload.token.toLowerCase() === fromChainConfig.nativeToken.toLowerCase();

      const tx = new Transaction();

      const coin: any = isNative
        ? await SuiIntentService.getNativeCoin(tx, intent)
        : await SuiIntentService.getCoin(tx, intent.token, intent.amount.valueOf(), provider.account.address, provider);

      tx.moveCall({
        target: `${fromChainConfig.packageId}::main::swap`,
        arguments: [
          tx.object(fromChainConfig.storageId),
          tx.pure.string(intent.dstNID),
          tx.object(coin),
          tx.pure.string(intent.toToken),
          tx.pure.string(intent.destinationAddress),
          tx.pure.u128(intent.toAmount.valueOf()),
          tx.pure(bcs.vector(bcs.u8()).serialize(intent.data)),
        ],
        typeArguments: [intent.token],
      });

      const signerAccount = provider.account;
      const chain = signerAccount.chains[0];

      if (!chain) {
        return {
          ok: false,
          error: new Error('[SuiIntentService.executeOrder] Chain undefined in signerAccount'),
        };
      }

      const { bytes, signature } = await signTransaction(provider.wallet, {
        transaction: tx,
        account: provider.account,
        chain: chain,
      });

      const result = await provider.client.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
        },
      });

      return {
        ok: true,
        value: result.digest,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  /**
   * Cancel SUI intent order
   * @param orderId - Intent order ID
   * @param chainConfig - SUI chain config
   * @param provider - SUI provider
   */
  public static async cancelIntentOrder(
    orderId: bigint,
    chainConfig: SuiChainConfig,
    provider: SuiProvider,
  ): Promise<Result<string>> {
    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${chainConfig.packageId}::main::cancel`,
        arguments: [tx.object(chainConfig.storageId), tx.pure(bcs.u128().serialize(orderId))],
      });

      const signerAccount = provider.account;
      const chain = signerAccount.chains[0];

      if (!chain) {
        return {
          ok: false,
          error: new Error('[SuiIntentService.cancelIntentOrder] Chain undefined in signerAccount'),
        };
      }

      const result = await signAndExecuteTransaction(provider.wallet, {
        transaction: tx,
        account: provider.account,
        chain: provider.account.chains[0]!,
      });

      return {
        ok: true,
        value: result.digest,
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  public static async getNativeCoin(
    tx: Transaction,
    intent: SwapOrder,
  ): Promise<{ $kind: 'NestedResult'; NestedResult: [number, number] }> {
    const coin = tx.splitCoins(tx.gas, [intent.amount.valueOf()])[0];

    if (coin === undefined) {
      return Promise.reject(Error('[SuiIntentService.getNativeCoin] coin undefined'));
    }

    return coin;
  }

  public static async getCoin(
    tx: Transaction,
    coin: string,
    amount: bigint,
    address: string,
    provider: SuiProvider,
  ): Promise<TransactionResult | string> {
    const coins = await provider.client.getCoins({
      owner: address,
      coinType: coin,
    });

    const objects: string[] = [];
    let totalAmount = BigInt(0);

    for (const coin of coins.data) {
      totalAmount += BigInt(coin.balance);
      objects.push(coin.coinObjectId);

      if (totalAmount >= amount) {
        break;
      }
    }

    const firstObject = objects[0];

    if (!firstObject) {
      throw new Error(`[SuiIntentService.getCoin] Coin=${coin} not found for address=${address} and amount=${amount}`);
    }

    if (objects.length > 1) {
      tx.mergeCoins(firstObject, objects.slice(1));
    }

    if (totalAmount === amount) {
      return firstObject;
    }

    return tx.splitCoins(firstObject, [amount]);
  }

  /**
   * Retrieve Intent order
   * @param txHash - Transaction hash
   * @param chainConfig - SUI chain config
   * @param provider - SUI provider
   */
  static async getOrder(
    txHash: string,
    chainConfig: SuiChainConfig,
    provider: SuiProvider,
  ): Promise<Result<SwapOrder>> {
    try {
      const transaction = await provider.client.waitForTransaction({
        digest: txHash,
        options: {
          showEffects: false,
          showEvents: true,
        },
      });

      const order: any = transaction.events?.at(0)?.parsedJson;
      return {
        ok: true,
        value: new SwapOrder(
          BigInt(order.id),
          order.emitter,
          order.src_nid,
          order.dst_nid,
          order.creator,
          order.destination_address,
          order.token,
          BigInt(order.amount),
          order.to_token,
          BigInt(order.to_amount),
          order.data,
        ),
      };
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }
}
