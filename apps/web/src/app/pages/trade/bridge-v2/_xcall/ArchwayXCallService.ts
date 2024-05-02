import { sha256 } from '@cosmjs/crypto';
import { toHex } from '@cosmjs/encoding';
import { StdFee } from '@archwayhq/arch3.js';

import { archway, xChainMap } from 'app/_xcall/archway/config1';
import { ASSET_MANAGER_TOKENS, CROSS_TRANSFER_TOKENS } from 'app/_xcall/config';
import { getFeeParam } from 'app/_xcall/archway/utils';
import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';

import { bridgeTransferActions } from '../_zustand/useBridgeTransferStore';
import { XCallEventType, XChainId } from 'app/_xcall/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer, BridgeTransferStatus, XCallEvent, XCallEventMap } from '../_zustand/types';
import { transactionActions } from '../_zustand/useTransactionStore';
import { Transaction } from '../_zustand/types';

export class ArchwayXCallService implements XCallService {
  xChainId: XChainId;
  client: any;
  signedClient: any;

  constructor(xChainId: XChainId, client, signedClient) {
    this.xChainId = xChainId;
    this.client = client;
    this.signedClient = signedClient;
  }

  async fetchXCallFee(to: XChainId, rollback: boolean) {
    return await this.client.queryContractSmart(archway.contracts.xCall, {
      get_fee: { nid: xChainMap[to].xChainId, rollback },
    });
  }

  async fetchBlockHeight() {
    const height = await this.client.getHeight();
    return height;
  }

  parseSourceEventData(eventType, eventData) {
    const sn = eventData.attributes.find(a => a.key === 'sn')?.value;

    if (sn) {
      return {
        eventType,
        sn: parseInt(sn),
        rawEventData: eventData,
        xChainId: this.xChainId,
      };
    }
  }

  parseDestinationEventData(eventType, eventData): XCallEvent {
    const sn = eventData.attributes.find(a => a.key === 'sn')?.value;
    const reqId = eventData.attributes.find(a => a.key === 'reqId')?.value;

    return {
      eventType,
      sn: sn ? parseInt(sn) : -1,
      reqId: reqId && parseInt(reqId),
      rawEventData: eventData,
      xChainId: this.xChainId,
    };
  }

  async filterCallMessageSentEvent(events) {
    const eventFiltered = events.find(e => e.type === 'wasm-send_packet');
    return eventFiltered;
  }

  async fetchSourceEvents(transfer: BridgeTransfer) {
    try {
      const callMessageSentEvent = this.filterCallMessageSentEvent(transfer.transactions[0].rawTx.events);
      return {
        [XCallEventType.CallMessageSent]: this.parseSourceEventData(
          XCallEventType.CallMessageSent,
          callMessageSentEvent,
        ),
      };
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async getBlock(blockHeight) {
    const block = await this.client.getBlock(blockHeight);
    return block;
  }

  async getTx(txHash) {
    const tx = await this.client.getTx(txHash);
    return tx;
  }

  async filterEvent(rawTx, signature) {
    const txHash = toHex(sha256(Buffer.from(rawTx, 'base64')));
    const tx = await this.getTx(txHash);

    if (tx.events.length > 0) {
      for (const event of tx.events) {
        if (event.type === signature) {
          return event;
        }
      }
    }
  }

  async filterCallMessageEvent(rawTx) {
    const eventFiltered = await this.filterEvent(rawTx, 'wasm-CallMessage');
    return eventFiltered;
  }

  async filterCallExecutedEvent(rawTx) {
    const eventFiltered = await this.filterEvent(rawTx, 'wasm-CallExecuted');
    return eventFiltered;
  }

  async fetchDestinationEventsByBlock(blockHeight) {
    const events: any = [];

    const block = await this.getBlock(blockHeight);

    if (block) {
      if (block.txs.length > 0) {
        for (const rawTx of block.txs) {
          const callMessageEvent = await this.filterCallMessageEvent(rawTx);
          const callExecutedEvent = await this.filterCallExecutedEvent(rawTx);

          if (callMessageEvent) {
            events.push(this.parseDestinationEventData(XCallEventType.CallMessage, callMessageEvent));
          }
          if (callExecutedEvent) {
            events.push(this.parseDestinationEventData(XCallEventType.CallExecuted, callExecutedEvent));
          }
        }
      }
    } else {
      return null;
    }
    return events;
  }

  async executeTransfer(bridgeInfo: BridgeInfo): Promise<BridgeTransfer | null> {
    const {
      bridgeDirection,
      currencyAmountToBridge,
      recipient: destinationAddress,
      account,
      xCallFee,
      isDenom,
    } = bridgeInfo;

    if (this.signedClient) {
      const tokenAddress = currencyAmountToBridge.wrapped.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      const executeTransaction = async (msg: any, contract: string, fee: StdFee | 'auto', assetToBridge?: any) => {
        let transaction: Transaction;
        try {
          transaction = transactionActions.add(this.xChainId, {
            status: 'pending',
            pendingMessage: 'Requesting cross-chain transfer...',
            successMessage: 'Cross-chain transfer requested.',
            errorMessage: 'Cross-chain transfer request failed',
          });

          const res = await this.signedClient.execute(
            account,
            contract,
            msg,
            fee,
            undefined,
            xCallFee.rollback !== '0'
              ? [
                  { amount: xCallFee.rollback, denom: ARCHWAY_FEE_TOKEN_SYMBOL },
                  ...(assetToBridge ? [assetToBridge] : []),
                ]
              : assetToBridge
                ? [assetToBridge]
                : undefined,
          );

          const {
            payload: { tx },
          } = res;
          if (tx) {
            transactionActions.success(this.xChainId, transaction.id, { hash: tx.transactionHash, rawTx: res });

            return transactionActions.getTransaction(this.xChainId, transaction.id);
          } else {
            transactionActions.fail(this.xChainId, transaction.id, {});
          }
        } catch (e) {
          console.error(e);

          // @ts-ignore
          transactionActions.fail(this.xChainId, transaction.id, {});
        }
      };

      let transaction: Transaction | undefined;
      bridgeTransferActions.setIsTransferring(true);

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
        } else if (ASSET_MANAGER_TOKENS.includes(currencyAmountToBridge.currency.symbol || '')) {
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
      if (transaction) {
        return {
          id: `${this.xChainId}/${transaction.hash}`,
          bridgeInfo,
          transactions: [transaction],
          status: BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT,
          events: {},
          destinationChainInitialBlockHeight: -1,
        };
      } else {
        bridgeTransferActions.setIsTransferring(false);
      }
    }

    return null;
  }
}
