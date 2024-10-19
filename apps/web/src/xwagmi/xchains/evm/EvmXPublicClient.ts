import { Address, PublicClient, WriteContractParameters, erc20Abi, getContract, parseEventLogs, toHex } from 'viem';

import { xChainMap } from '@/xwagmi/constants/xChains';
import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { MaxUint256, Percent } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import {
  TransactionStatus,
  XCallEvent,
  XCallEventType,
  XCallExecutedEvent,
  XCallMessageEvent,
  XCallMessageSentEvent,
  XTransactionInput,
  XTransactionType,
} from '../../xcall/types';
import { EvmXService } from './EvmXService';
import { xCallContractAbi } from './abis/xCallContractAbi';
import { isNativeCurrency } from '@/constants/tokens';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { assetManagerContractAbi } from './abis/assetManagerContractAbi';
import { bnUSDContractAbi } from './abis/bnUSDContractAbi';
import { getRlpEncodedSwapData } from '@/xwagmi/xcall/utils';
import bnJs from '../icon/bnJs';

const XCallEventSignatureMap = {
  [XCallEventType.CallMessageSent]: 'CallMessageSent',
  [XCallEventType.CallMessage]: 'CallMessage',
  [XCallEventType.CallExecuted]: 'CallExecuted',
};

export class EvmXPublicClient extends XPublicClient {
  getXService(): EvmXService {
    return EvmXService.getInstance();
  }

  getChainId() {
    const xChain = xChainMap[this.xChainId];
    return xChain.id;
  }

  getPublicClient(): PublicClient {
    const publicClient = this.getXService().getPublicClient(this.getChainId());
    if (!publicClient) {
      throw new Error('EvmXPublicClient: publicClient is not initialized yet');
    }
    return publicClient;
  }

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) return;

    if (xToken.isNativeXToken()) {
      const balance = await this.getPublicClient().getBalance({ address: address as Address });
      return CurrencyAmount.fromRawAmount(xToken, balance);
    } else {
      throw new Error(`Unsupported token: ${xToken.symbol}`);
    }
  }

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};

    const balancePromises = xTokens
      .filter(xToken => xToken.isNativeXToken())
      .map(async xToken => {
        const balance = await this.getBalance(address, xToken);
        return { symbol: xToken.symbol, address: xToken.address, balance };
      });

    const balances = await Promise.all(balancePromises);
    const tokenMap = balances.reduce((map, { address, balance }) => {
      if (balance) map[address] = balance;
      return map;
    }, {});

    const nonNativeXTokens = xTokens.filter(xToken => !xToken.isNativeXToken());
    const result = await this.getPublicClient().multicall({
      contracts: nonNativeXTokens.map(token => ({
        abi: erc20Abi,
        address: token.address as `0x${string}`,
        functionName: 'balanceOf',
        args: [address],
        chainId: this.getChainId(),
      })),
    });

    return nonNativeXTokens
      .map((token, index) => CurrencyAmount.fromRawAmount(token, result[index].result?.toString() || '0'))
      .reduce((acc, balance) => {
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, tokenMap);
  }

  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources: string[] = []) {
    const contract = getContract({
      abi: xCallContractAbi,
      address: xChainMap[xChainId].contracts.xCall as Address,
      client: this.getPublicClient(),
    });
    const fee = await contract.read.getFee([nid, rollback, sources]);
    return BigInt(fee);
  }

  async getBlockHeight() {
    const blockNumber = await this.getPublicClient().getBlockNumber();
    return blockNumber;
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.getPublicClient().getBlock({ blockNumber: blockHeight });
    return block;
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    const eventLogs = await this.getPublicClient().getLogs({
      fromBlock: startBlockHeight,
      toBlock: endBlockHeight,
      address: xChainMap[xChainId].contracts.xCall as Address,
    });

    const parsedLogs = parseEventLogs({
      abi: xCallContractAbi,
      logs: eventLogs,
    });

    return parsedLogs;
  }

  async getTxReceipt(txHash: string) {
    const tx = await this.getPublicClient().getTransactionReceipt({ hash: txHash as Address });
    return tx;
  }

  getTxEventLogs(rawTx) {
    return parseEventLogs({
      abi: xCallContractAbi,
      logs: rawTx?.logs,
    });
  }

  deriveTxStatus(rawTx): TransactionStatus {
    try {
      if (rawTx.transactionHash) {
        if (rawTx.status === 'success') {
          return TransactionStatus.success;
        } else {
          return TransactionStatus.failure;
        }
      }
    } catch (e) {}

    return TransactionStatus.pending;
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    const events: any[] = [];
    [XCallEventType.CallMessageSent, XCallEventType.CallMessage, XCallEventType.CallExecuted].forEach(eventType => {
      const parsedEventLogs = this._filterEventLogs(eventLogs, eventType).map(eventLog =>
        this._parseEventLog(eventLog, eventLog.transactionHash, eventType),
      );
      events.push(...parsedEventLogs);
    });
    return events;
  }

  _filterEventLogs(eventLogs, xCallEventType: XCallEventType) {
    return eventLogs.filter(e => e.eventName === XCallEventSignatureMap[xCallEventType]);
  }

  _parseEventLog(eventLog: any, txHash: string, eventType: XCallEventType): XCallEvent {
    if (eventType === XCallEventType.CallMessageSent) {
      return this._parseCallMessageSentEventLog(eventLog, txHash);
    }
    if (eventType === XCallEventType.CallMessage) {
      return this._parseCallMessageEventLog(eventLog, txHash);
    }
    if (eventType === XCallEventType.CallExecuted) {
      return this._parseCallExecutedEventLog(eventLog, txHash);
    }

    throw new Error(`Unknown xCall event type: ${eventType}`);
  }

  _parseCallMessageSentEventLog(eventLog, txHash: string): XCallMessageSentEvent {
    return {
      eventType: XCallEventType.CallMessageSent,
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      sn: eventLog.args._sn,
      from: eventLog.args._from,
      to: eventLog.args._to,
    };
  }
  _parseCallMessageEventLog(eventLog, txHash: string): XCallMessageEvent {
    return {
      eventType: XCallEventType.CallMessage,
      txHash,
      // xChainId: this.xChainId,
      // rawEventData: eventLog,
      sn: eventLog.args._sn,
      reqId: eventLog.args._reqId,
      from: eventLog.args._from,
      to: eventLog.args._to,
      data: eventLog.args._data,
    };
  }
  _parseCallExecutedEventLog(eventLog, txHash: string): XCallExecutedEvent {
    return {
      eventType: XCallEventType.CallExecuted,
      // xChainId: this.xChainId,
      txHash,
      // rawEventData: eventLog,
      reqId: eventLog.args._reqId,
      code: parseInt(eventLog.args._code),
      msg: eventLog.args._msg,
    };
  }

  async getTokenAllowance(owner: string | null | undefined, spender: string | undefined, xToken: XToken | undefined) {
    if (!owner || !spender || !xToken) return;

    const res = await this.getPublicClient().readContract({
      abi: erc20Abi,
      address: xToken.address as `0x${string}`,
      functionName: 'allowance',
      args: [owner as `0x${string}`, spender as `0x${string}`],
    });

    return res;
  }

  needsApprovalCheck(xToken: XToken): boolean {
    if (isNativeCurrency(xToken)) return false;

    const isBnUSD = xToken.symbol === 'bnUSD';
    if (isBnUSD) return false;

    return true;
  }

  async estimateApproveGas(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    const xToken = amountToApprove.currency;

    const publicClient = await this.getPublicClient();

    const tokenContract = getContract({
      abi: erc20Abi,
      address: xToken.address as Address,
      client: { public: publicClient },
    });
    const account = owner as Address;
    const res = await tokenContract.estimateGas.approve(
      [spender as `0x${string}`, amountToApprove?.quotient ? BigInt(amountToApprove.quotient.toString()) : MaxUint256],
      { account },
    );

    console.log('approve gas', res);
    return res;
  }

  async estimateSwapGas(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, recipient, account, xCallFee, executionTrade, slippageTolerance } =
      xTransactionInput;

    const receiver = `${direction.to}/${recipient}`;
    const tokenAddress = inputAmount.wrapped.currency.address;
    const amount = BigInt('0');
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    let data: Address;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }
      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
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

    // check if the bridge asset is native
    const isNative = isNativeCurrency(inputAmount.currency);
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    const publicClient = this.getPublicClient();
    try {
      let res;
      if (isBnUSD) {
        res = await publicClient.estimateContractGas({
          account: account as Address,
          address: xChainMap[direction.from].contracts.bnUSD as Address,
          abi: bnUSDContractAbi,
          functionName: 'crossTransfer',
          args: [destination, amount, data],
          value: xCallFee.rollback,
        });
      } else {
        if (!isNative) {
          res = await publicClient.estimateContractGas({
            account: account as Address,
            address: xChainMap[direction.from].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'deposit',
            args: [tokenAddress as Address, amount, destination, data],
            value: xCallFee.rollback,
          });
        } else {
          res = await publicClient.estimateContractGas({
            account: account as Address,
            address: xChainMap[direction.from].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'depositNative',
            args: [amount, destination, data],
            value: xCallFee.rollback + amount,
          });
        }
      }
      console.log('swap gas', res);
      return res;
    } catch (e) {
      console.log(e);
    }
  }
}
