import { XCallEventType, XChainId } from 'app/pages/trade/bridge-v2/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer, TransactionStatus, XCallEvent } from '../_zustand/types';
import { avalanche } from 'app/pages/trade/bridge-v2/_config/xChains';
import {
  Address,
  PublicClient,
  WalletClient,
  WriteContractParameters,
  parseEther,
  parseEventLogs,
  zeroAddress,
} from 'viem';
import { NATIVE_ADDRESS } from 'constants/index';

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
  fetchXCallFee(to: XChainId, rollback: boolean) {
    return Promise.resolve({
      rollback: 0n,
      noRollback: 0n,
    });
  }

  async fetchBlockHeight() {
    const blockNumber = await this.publicClient.getBlockNumber();
    return blockNumber;
  }

  async getBlock(blockHeight: bigint) {
    const block = await this.publicClient.getBlock({ blockNumber: blockHeight });
    return block;
  }

  async getTx(txHash: string) {
    const tx = await this.publicClient.getTransactionReceipt({ hash: txHash as Address });
    return tx;
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

  parseCallMessageSentEventLog(eventLog): XCallEvent {
    const sn = eventLog.args._sn;

    return {
      eventType: XCallEventType.CallMessageSent,
      sn: sn,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallMessageEventLog(eventLog): XCallEvent {
    const sn = eventLog.args._sn;
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallMessage,
      sn: sn,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }
  parseCallExecutedEventLog(eventLog): XCallEvent {
    const reqId = eventLog.args._reqId;

    return {
      eventType: XCallEventType.CallExecuted,
      sn: -1n,
      reqId,
      xChainId: this.xChainId,
      rawEventData: eventLog,
    };
  }

  filterEventLog(eventLogs, signature) {
    if (eventLogs && eventLogs.length > 0) {
      for (const event of eventLogs) {
        if (event.eventName === signature) {
          return event;
        }
      }
    }
  }

  filterCallMessageSentEventLog(eventLogs) {
    const eventFiltered = eventLogs.find(e => e.eventName === 'CallMessageSent');
    return eventFiltered;
  }

  filterCallMessageEventLog(eventLogs) {
    const eventFiltered = this.filterEventLog(eventLogs, 'CallMessage');
    return eventFiltered;
  }

  filterCallExecutedEventLog(eventLogs) {
    const eventFiltered = this.filterEventLog(eventLogs, 'CallExecuted');
    return eventFiltered;
  }

  async fetchSourceEvents(transfer: BridgeTransfer) {
    try {
      const rawTx = transfer.sourceTransaction.rawTx;

      const parsedLogs = parseEventLogs({
        abi: xCallContractAbi,
        logs: rawTx.logs,
      });

      const callMessageSentEventLog = this.filterCallMessageSentEventLog(parsedLogs);
      return {
        [XCallEventType.CallMessageSent]: this.parseCallMessageSentEventLog(callMessageSentEventLog),
      };
    } catch (e) {
      console.error(e);
    }
    return {};
  }

  async fetchDestinationEventsByBlock(blockHeight) {
    const events: any = [];

    const block = await this.getBlock(blockHeight);

    console.log('fetchDestinationEventsByBlock', block);

    if (block && block.transactions.length > 0) {
      for (const txHash of block.transactions) {
        const rawTx = await this.getTx(txHash);

        console.log('rawTx', rawTx);
        const parsedLogs = parseEventLogs({
          abi: xCallContractAbi,
          logs: rawTx.logs,
        });

        const callMessageEventLog = this.filterCallMessageEventLog(parsedLogs);
        const callExecutedEventLog = this.filterCallExecutedEventLog(parsedLogs);

        console.log('fetchDestinationEventsByBlock', callMessageEventLog, callExecutedEventLog);

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
    const { bridgeDirection, currencyAmountToBridge, recipient: destinationAddress, account, xCallFee } = bridgeInfo;

    if (this.walletClient) {
      const tokenAddress = currencyAmountToBridge.wrapped.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;
      const amount = BigInt(currencyAmountToBridge.quotient.toString());

      // check if the bridge asset is native
      const isNative = currencyAmountToBridge.currency.wrapped.address === NATIVE_ADDRESS;

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
          args: [amount, destination],
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
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'depositNative',
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
    inputs: [
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'to', type: 'string' },
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
