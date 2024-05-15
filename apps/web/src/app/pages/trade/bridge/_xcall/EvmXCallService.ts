import { XCallEventType, XChainId } from 'app/pages/trade/bridge/types';
import { XCallService } from './types';
import { XSwapInfo, Transaction, TransactionStatus, XCallDestinationEvent, XCallSourceEvent } from '../_zustand/types';
import { avalanche } from 'app/pages/trade/bridge/_config/xChains';
import { getBytesFromString } from 'app/pages/trade/bridge/utils';

import { Address, PublicClient, WalletClient, WriteContractParameters, parseEventLogs, toHex } from 'viem';
import { NATIVE_ADDRESS } from 'constants/index';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';
import { Percent } from '@balancednetwork/sdk-core';
import bnJs from 'bnJs';

export class EvmXCallService implements XCallService {
  xChainId: XChainId;
  publicClient: PublicClient;
  walletClient: WalletClient;

  constructor(xChainId: XChainId, serviceConfig: any) {
    const { publicClient, walletClient } = serviceConfig;
    this.xChainId = xChainId;
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  // TODO: complete this
  getXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
  }

  async getBlockHeight() {
    const blockNumber = await this.publicClient.getBlockNumber();
    return blockNumber;
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlock({ blockNumber: blockHeight });
    return block;
  }

  async getBlockEventLogs(blockHeight: bigint) {
    const eventLogs = await this.publicClient.getLogs({
      fromBlock: blockHeight,
      toBlock: blockHeight,
      // fromBlock: 45272443n,
      // toBlock: 45272459n,
      // address: avalanche.contracts.xCall as Address, // TODO: is it right?
      // TODO: need to add more filters?
    });

    // const parsedLogs = parseEventLogs({
    //   abi: xCallContractAbi,
    //   logs: eventLogs,
    // });

    // console.log(parsedLogs);

    return eventLogs;
  }

  async getTxReceipt(txHash: string) {
    const tx = await this.publicClient.getTransactionReceipt({ hash: txHash as Address });
    return tx;
  }

  getTxEventLogs(rawTx) {
    return rawTx?.logs;
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

  parseCallMessageSentEventLog(eventLog, txHash: string): XCallSourceEvent {
    const sn = eventLog.args._sn;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: sn,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
    };
  }
  parseCallMessageEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const sn = eventLog.args._sn;
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallMessage,
      sn: sn,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }
  parseCallExecutedEventLog(eventLog, txHash: string): XCallDestinationEvent {
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
      txHash,
      isSuccess: true,
    };
  }

  filterEventLogs(eventLogs, signature) {
    return eventLogs.filter(e => e.eventName === signature);
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.eventName === 'CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLogs(eventLogs) {
    const eventFiltered = this.filterEventLogs(eventLogs, 'CallExecuted');
    return eventFiltered;
  }

  async getSourceEvents(sourceTransaction: Transaction) {
    try {
      if (!sourceTransaction.rawEventLogs) {
        return {};
      }
      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: sourceTransaction.rawEventLogs,
      });

      const callMessageSentEventLog = this.filterCallMessageSentEventLog(parsedLogs);
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

  async getDestinationEventsByBlock(blockHeight) {
    const events: any = [];
    try {
      const eventLogs = await this.getBlockEventLogs(blockHeight);
      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: eventLogs,
      });

      const callMessageEventLogs = this.filterCallMessageEventLogs(parsedLogs);
      const callExecutedEventLogs = this.filterCallExecutedEventLogs(parsedLogs);

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

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransfer(xSwapInfo: XSwapInfo) {
    const { direction, inputAmount, recipient: destinationAddress, account, xCallFee } = xSwapInfo;

    if (this.walletClient) {
      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;
      const amount = BigInt(inputAmount.quotient.toString());

      // check if the bridge asset is native
      const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;

      let request: WriteContractParameters;
      if (!isNative) {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: avalanche.contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'deposit',
          args: [tokenAddress as Address, amount, destination],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: avalanche.contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'depositNative',
          args: [amount, destination, '0x'],
          value: xCallFee.rollback + amount,
        });
        request = res.request;
      }

      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }

  async executeSwap(xSwapInfo: XSwapInfo) {
    const { direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } = xSwapInfo;

    if (!executionTrade || !slippageTolerance) {
      return;
    }

    const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

    if (this.walletClient) {
      const receiver = `${direction.to}/${recipient}`;

      const tokenAddress = inputAmount.wrapped.currency.address;
      const amount = BigInt(inputAmount.quotient.toString());
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
      const data = toHex(
        JSON.stringify({
          method: '_swap',
          params: {
            path: executionTrade.route.pathForSwap,
            receiver: receiver,
            minimumReceive: minReceived.quotient.toString(),
          },
        }),
      );
      // check if the bridge asset is native
      const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;

      let request: WriteContractParameters;
      if (!isNative) {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: avalanche.contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'deposit',
          args: [tokenAddress as Address, amount, destination, data],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: avalanche.contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'depositNative',
          args: [amount, destination, data],
          value: xCallFee.rollback + amount,
        });
        request = res.request;
      }

      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }
}

export const xCallContractAbi = [
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_reqId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'int256',
        name: '_code',
        type: 'int256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: '_msg',
        type: 'string',
      },
    ],
    name: 'CallExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: '_from',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'string',
        name: '_to',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_reqId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'CallMessage',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'string',
        name: '_to',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'CallMessageSent',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'int256',
        name: '_code',
        type: 'int256',
      },
    ],
    name: 'ResponseMessage',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'RollbackExecuted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'RollbackMessage',
    type: 'event',
  },
  {
    inputs: [],
    name: 'admin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_reqId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'executeCall',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'from',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
      {
        internalType: 'string[]',
        name: 'protocols',
        type: 'string[]',
      },
    ],
    name: 'executeMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'executeRollback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_nid',
        type: 'string',
      },
    ],
    name: 'getDefaultConnection',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_net',
        type: 'string',
      },
      {
        internalType: 'bool',
        name: '_rollback',
        type: 'bool',
      },
      {
        internalType: 'string[]',
        name: '_sources',
        type: 'string[]',
      },
    ],
    name: 'getFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_net',
        type: 'string',
      },
      {
        internalType: 'bool',
        name: '_rollback',
        type: 'bool',
      },
    ],
    name: 'getFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNetworkAddress',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNetworkId',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProtocolFee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProtocolFeeHandler',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_src',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_svc',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_code',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: '_msg',
        type: 'string',
      },
    ],
    name: 'handleBTPError',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_from',
        type: 'string',
      },
      {
        internalType: 'string',
        name: '_svc',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_msg',
        type: 'bytes',
      },
    ],
    name: 'handleBTPMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'handleError',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_from',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: '_msg',
        type: 'bytes',
      },
    ],
    name: 'handleMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_nid',
        type: 'string',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_to',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'sendCall',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_to',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_rollback',
        type: 'bytes',
      },
    ],
    name: 'sendCallMessage',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_to',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: '_rollback',
        type: 'bytes',
      },
      {
        internalType: 'string[]',
        name: 'sources',
        type: 'string[]',
      },
      {
        internalType: 'string[]',
        name: 'destinations',
        type: 'string[]',
      },
    ],
    name: 'sendCallMessage',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_address',
        type: 'address',
      },
    ],
    name: 'setAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_nid',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'connection',
        type: 'address',
      },
    ],
    name: 'setDefaultConnection',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'setProtocolFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_addr',
        type: 'address',
      },
    ],
    name: 'setProtocolFeeHandler',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sn',
        type: 'uint256',
      },
    ],
    name: 'verifySuccess',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const assetManagerContractAbi = [
  { inputs: [{ internalType: 'address', name: 'target', type: 'address' }], name: 'AddressEmptyCode', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'AddressInsufficientBalance',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
    type: 'error',
  },
  { inputs: [], name: 'ERC1967NonPayable', type: 'error' },
  { inputs: [], name: 'FailedInnerCall', type: 'error' },
  { inputs: [], name: 'InvalidInitialization', type: 'error' },
  { inputs: [], name: 'NotInitializing', type: 'error' },
  { inputs: [{ internalType: 'address', name: 'owner', type: 'address' }], name: 'OwnableInvalidOwner', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  { inputs: [], name: 'UUPSUnauthorizedCallContext', type: 'error' },
  {
    inputs: [{ internalType: 'bytes32', name: 'slot', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint64', name: 'version', type: 'uint64' }],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: 'address', name: 'implementation', type: 'address' }],
    name: 'Upgraded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'NATIVE_ADDRESS',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: '_period', type: 'uint256' },
      { internalType: 'uint256', name: '_percentage', type: 'uint256' },
    ],
    name: 'configureRateLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'currentLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'to', type: 'string' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'to', type: 'string' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'to', type: 'string' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'depositNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getImplementation',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'getWithdrawLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'from', type: 'string' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
      { internalType: 'string[]', name: 'protocols', type: 'string[]' },
    ],
    name: 'handleCallMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'iconAssetManager',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_xCall', type: 'address' },
      { internalType: 'string', name: '_iconAssetManager', type: 'string' },
      { internalType: 'address', name: '_xCallManager', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'lastUpdate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'percentage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'period',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }],
    name: 'resetLimit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'xCall',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'xCallManager',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'xCallNetworkAddress',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
