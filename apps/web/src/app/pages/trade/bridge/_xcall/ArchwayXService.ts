import { sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';
import { ArchwayClient, StdFee } from '@archwayhq/arch3.js';
import bnJs from 'bnJs';
import { Percent } from '@balancednetwork/sdk-core';

import { XSigningArchwayClient } from 'lib/archway/XSigningArchwayClient';
import { getBytesFromString } from 'app/pages/trade/bridge/utils';

import { archway, xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { CROSS_TRANSFER_TOKENS } from 'app/pages/trade/bridge/_config/xTokens';
import { getFeeParam, isDenomAsset } from 'app/_xcall/archway/utils';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';

import { XCallEventType, XChainId, XToken } from 'app/pages/trade/bridge/types';
import { XService } from './types';
import {
  XTransactionInput,
  TransactionStatus,
  XCallEvent,
  Transaction,
  XCallDestinationEvent,
  XCallSourceEvent,
} from '../_zustand/types';
import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';

export class ArchwayXService implements XService {
  xChainId: XChainId;
  publicClient: ArchwayClient;
  walletClient: XSigningArchwayClient;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { publicClient, walletClient } = serviceConfig;
    this.xChainId = xChainId;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  async getXCallFee(to: XChainId, rollback: boolean) {
    return await this.publicClient.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: xChainMap[to].xChainId, rollback },
    });
  }

  async getBlockHeight() {
    const height = await this.publicClient.getHeight();
    return BigInt(height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlock(Number(blockHeight));
    return block;
  }

  // TODO: deprecate
  async getBlockEventLogs(blockHeight: bigint) {
    let txs;

    // TODO: is 10 iterations enough?
    for (let i = 0; i < 10; i++) {
      txs = await this.publicClient.searchTx(`tx.height=${blockHeight}`);
      if (txs) {
        break;
      }
    }

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = txs.flatMap(tx => tx.events.map(e => ({ ...e, transactionHash: tx.hash })));
    return events;
  }

  async getEventLogs({ startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    let txs;

    // TODO: is 10 iterations enough?
    for (let i = 0; i < 10; i++) {
      txs = await this.publicClient.searchTx(`tx.height>=${startBlockHeight} AND tx.height<=${endBlockHeight}`);

      if (txs) {
        break;
      }
    }

    // txs is an array of tx, each tx has events, which is an array of event, return all events merged
    const events = txs.flatMap(tx => tx.events.map(e => ({ ...e, transactionHash: tx.hash })));

    return events;
  }

  async getTxReceipt(txHash) {
    const tx = await this.publicClient.getTx(txHash);
    return tx;
  }

  getTxEventLogs(rawTx) {
    return rawTx?.events;
  }

  // TODO: review again
  deriveTxStatus(rawTx: any): TransactionStatus {
    if (rawTx) {
      if (rawTx.code) {
        return TransactionStatus.failure;
      }

      return TransactionStatus.success;
    }

    return TransactionStatus.failure;
  }

  parseCallMessageSentEventLog(eventLog, txHash: string): XCallSourceEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType: XCallEventType.CallMessage,
      sn: BigInt(sn),
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
  parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }

  async filterEventLogs(eventLogs, signature) {
    return eventLogs.filter(e => e.type === signature);
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.type === 'wasm-CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'wasm-CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'wasm-CallExecuted');
    return eventFiltered;
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      const callMessageSentEventLog = this.filterCallMessageSentEventLog(sourceTransaction.rawEventLogs);
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(
          callMessageSentEventLog,
          sourceTransaction.hash,
        ),
      };
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  getScanBlockCount() {
    return 10n;
  }

  async getDestinationEvents({
    startBlockHeight,
    endBlockHeight,
  }: { startBlockHeight: bigint; endBlockHeight: bigint }) {
    try {
      const events: any = [];

      const eventLogs = await this.getEventLogs({ startBlockHeight, endBlockHeight });
      const callMessageEventLogs = await this.filterCallMessageEventLogs(eventLogs);
      const callExecutedEventLogs = await this.filterCallExecutedEventLogs(eventLogs);

      callMessageEventLogs.forEach(eventLog => {
        events.push(this.parseCallMessageEventLog(eventLog, eventLog.transactionHash));
      });
      callExecutedEventLogs.forEach(eventLog => {
        events.push(this.parseCallExecutedEventLog(eventLog, eventLog.transactionHash));
      });

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  // TODO: deprecate
  async getDestinationEventsByBlock(blockHeight: bigint) {
    try {
      const events: any = [];

      const eventLogs = await this.getBlockEventLogs(blockHeight);
      const callMessageEventLogs = await this.filterCallMessageEventLogs(eventLogs);
      const callExecutedEventLogs = await this.filterCallExecutedEventLogs(eventLogs);

      callMessageEventLogs.forEach(eventLog => {
        events.push(this.parseCallMessageEventLog(eventLog, eventLog.transactionHash));
      });
      callExecutedEventLogs.forEach(eventLog => {
        events.push(this.parseCallExecutedEventLog(eventLog, eventLog.transactionHash));
      });

      return events;
    } catch (e) {
      console.log(e);
    }
    return null;
  }

  async approve(token: XToken, owner: string, spender: string, currencyAmountToApprove: CurrencyAmount<XToken>) {
    const msg = {
      increase_allowance: {
        spender: spender,
        amount: currencyAmountToApprove?.quotient
          ? currencyAmountToApprove?.quotient.toString()
          : MaxUint256.toString(),
      },
    };

    const hash = await this.walletClient.executeSync(owner, token.address, msg, getFeeParam(400000));

    if (hash) {
      return hash;
    }
  }

  async executeTransfer(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, recipient: destinationAddress, account, xCallFee } = xTransactionInput;
    const isDenom = inputAmount && inputAmount.currency instanceof XToken ? isDenomAsset(inputAmount.currency) : false;

    if (this.walletClient) {
      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          const hash = await this.walletClient.executeSync(
            account,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== 0n
              ? [
                  { amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          return hash;
        } catch (e) {
          console.error(e);
        }
      };

      let transaction: any;
      if (isDenom) {
        const msg = { deposit_denom: { denom: tokenAddress, to: destination, data: [] } };
        const assetToBridge = {
          denom: tokenAddress,
          amount: `${inputAmount.quotient}`,
        };

        transaction = await executeTransaction(
          msg,
          archway.contracts.assetManager,
          getFeeParam(1200000),
          assetToBridge,
        );
      } else {
        if (CROSS_TRANSFER_TOKENS.includes(inputAmount.currency.symbol || '')) {
          const msg = {
            cross_transfer: {
              amount: `${inputAmount.quotient}`,
              to: destination,
              data: [],
            },
          };

          transaction = await executeTransaction(msg, tokenAddress, 'auto');
        } else {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: `${inputAmount.quotient}`,
              to: destination,
              data: [],
            },
          };

          transaction = await executeTransaction(msg, archway.contracts.assetManager, getFeeParam(1200000));
        }
      }
      return transaction;
    }
  }
  async executeSwap(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } = xTransactionInput;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    const receiver = `${direction.to}/${recipient}`;
    const token = inputAmount.currency.wrapped;

    const swapParams = {
      path: executionTrade.route.pathForSwap,
      receiver: receiver,
    };

    const data = getBytesFromString(
      JSON.stringify({
        method: '_swap',
        params: swapParams,
        minimumReceive: minReceived.quotient.toString(),
      }),
    );

    if (['bnUSD'].includes(token.symbol)) {
      //handle icon native tokens vs spoke assets
      const msg = {
        cross_transfer: {
          amount: inputAmount.quotient.toString(),
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          data,
        },
      };

      try {
        const hash = await this.walletClient.executeSync(
          account, //
          archway.contracts.bnUSD!,
          msg,
          'auto',
          undefined,
          [{ amount: xCallFee?.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
        );
        return hash;
      } catch (e) {
        console.error(e);
      }
    } else {
      const msg = {
        deposit: {
          token_address: token.address,
          amount: inputAmount.quotient.toString(),
          to: `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`,
          data,
        },
      };

      try {
        const hash = await this.walletClient.executeSync(
          account,
          archway.contracts.assetManager,
          msg,
          'auto',
          undefined,
          [{ amount: xCallFee.rollback.toString(), denom: ARCHWAY_FEE_TOKEN_SYMBOL }],
        );
        return hash;
      } catch (e) {
        console.error(e);
      }
    }
  }
}
