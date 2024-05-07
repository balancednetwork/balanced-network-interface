import { sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';
import { StdFee } from '@archwayhq/arch3.js';

import { archway, xChainMap } from 'app/pages/trade/bridge-v2/_config/xChains';
import { CROSS_TRANSFER_TOKENS } from 'app/pages/trade/bridge-v2/_config/xTokens';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';

import { XCallEventType, XChainId } from 'app/pages/trade/bridge-v2/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer, TransactionStatus, XCallEvent, Transaction } from '../_zustand/types';

export class ArchwayXCallService implements XCallService {
  xChainId: XChainId;
  client: any;
  signingClient: any;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { client, signingClient } = serviceConfig;
    this.xChainId = xChainId;
    this.client = client;
    this.signingClient = signingClient;
  }

  async fetchXCallFee(to: XChainId, rollback: boolean) {
    return await this.client.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: xChainMap[to].xChainId, rollback },
    });
  }

  async fetchBlockHeight() {
    const height = await this.client.getHeight();
    return BigInt(height);
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.client.getBlock(Number(blockHeight));
    return block;
  }

  async getTx(txHash) {
    const tx = await this.client.getTx(txHash);
    return tx;
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

  parseCallMessageSentEventLog(eventLog): XCallEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: BigInt(sn),
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallMessageEventLog(eventLog): XCallEvent {
    const sn = eventLog.attributes.find(a => a.key === 'sn')?.value;
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType: XCallEventType.CallMessage,
      sn: BigInt(sn),
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallExecutedEventLog(eventLog): XCallEvent {
    const reqId = eventLog.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId: BigInt(reqId),
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }

  async filterEventLog(eventLogs, signature) {
    if (eventLogs && eventLogs.length > 0) {
      for (const event of eventLogs) {
        if (event.type === signature) {
          return event;
        }
      }
    }
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.type === 'wasm-CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLog(eventLogs) {
    const eventFiltered = this.filterEventLog(eventLogs, 'wasm-CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLog(eventLogs) {
    const eventFiltered = this.filterEventLog(eventLogs, 'wasm-CallExecuted');
    return eventFiltered;
  }

  async fetchSourceEvents(transfer: BridgeTransfer) {
    try {
      console.log('fetchSourceEvents', transfer.sourceTransaction.rawTx.events);
      const callMessageSentEventLog = this.filterCallMessageSentEventLog(transfer.sourceTransaction.rawTx.events);
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(callMessageSentEventLog),
      };
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async fetchDestinationEventsByBlock(blockHeight: bigint) {
    const events: any = [];

    const block = await this.getBlock(blockHeight);

    if (block && block.txs.length > 0) {
      for (const rawTx of block.txs) {
        const txHash = toHex(sha256(Buffer.from(rawTx, 'base64')));
        const tx = await this.getTx(txHash);

        const callMessageEventLog = await this.filterCallMessageEventLog(tx.events);
        const callExecutedEventLog = await this.filterCallExecutedEventLog(tx.events);

        if (callMessageEventLog) {
          events.push(this.parseCallMessageEventLog(callMessageEventLog));
        }
        if (callExecutedEventLog) {
          events.push(this.parseCallExecutedEventLog(callExecutedEventLog));
        }
      }
    } else {
      return null;
    }
    return events;
  }

  async executeTransfer(bridgeInfo: BridgeInfo) {
    const {
      bridgeDirection,
      currencyAmountToBridge,
      recipient: destinationAddress,
      account,
      xCallFee,
      isDenom,
    } = bridgeInfo;

    if (this.signingClient) {
      const tokenAddress = currencyAmountToBridge.wrapped.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        try {
          const hash = await this.signingClient.executeSync(
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
          amount: `${currencyAmountToBridge.quotient}`,
        };

        transaction = await executeTransaction(
          msg,
          archway.contracts.assetManager,
          getFeeParam(1200000),
          assetToBridge,
        );
      } else {
        if (CROSS_TRANSFER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
          const msg = {
            cross_transfer: {
              amount: `${currencyAmountToBridge.quotient}`,
              to: destination,
              data: [],
            },
          };

          transaction = await executeTransaction(msg, tokenAddress, 'auto');
        } else {
          const msg = {
            deposit: {
              token_address: tokenAddress,
              amount: `${currencyAmountToBridge.quotient}`,
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
}
