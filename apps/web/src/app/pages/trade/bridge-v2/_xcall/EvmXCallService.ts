import { XChainId } from 'app/_xcall/types';
import { XCallService } from './types';
import { BridgeInfo, BridgeTransfer, TransactionStatus } from '../_zustand/types';
import { avalanche } from 'app/_xcall/archway/config1';
import {
  erc20Abi,
  Address,
  getContract,
  Abi,
  WriteContractReturnType,
  PublicClient,
  WalletClient,
  zeroAddress,
  parseEther,
} from 'viem';

const assetManagerContractAbi = [
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
      rollback: '0',
      noRollback: '0',
    });
  }

  async fetchBlockHeight() {
    const blockNumber = await this.publicClient.getBlockNumber();
    console.log('blockNumber', blockNumber);
    return blockNumber;
  }

  // TODO: complete this
  async getBlock(blockHeight: number) {}

  // TODO: complete this
  async getTx(txHash: string) {}

  // TODO: complete this
  deriveTxStatus(rawTx): TransactionStatus {
    return TransactionStatus.pending;
  }

  // TODO: complete this
  fetchSourceEvents(transfer: BridgeTransfer) {
    return Promise.resolve({});
  }

  fetchDestinationEventsByBlock(blockHeight) {
    return Promise.resolve([]);
  }

  // TODO: complete this
  async executeTransfer(bridgeInfo: BridgeInfo) {
    const { bridgeDirection, currencyAmountToBridge, recipient: destinationAddress, account, xCallFee } = bridgeInfo;

    if (this.walletClient) {
      const tokenAddress = currencyAmountToBridge.wrapped.currency.address;
      const destination = `${bridgeDirection.to}/${destinationAddress}`;

      const msg = {
        deposit: {
          token_address: tokenAddress,
          amount: `${currencyAmountToBridge.quotient}`,
          to: destination,
          data: [],
        },
      };

      const amount = BigInt(currencyAmountToBridge.quotient.toString());

      // const assetManagerContract = getContract({
      //   abi: assetManagerContractAbi,
      //   address: avalanche.contracts.assetManager as `0x${string}`,
      //   client: { public: this.publicClient, wallet: this.walletClient },
      // });

      // const estimatedGas = await assetManagerContract.estimateGas.deposit(
      //   [tokenAddress as `0x${string}`, amount, destination, '0x'],
      //   {
      //     account: account as `0x${string}`,
      //   },
      // );

      // assetManagerContract.estimateGas.deposit([zeroAddress, 0n, zeroAddress, '0x'], {
      //   account: account as `0x${string}`,
      // });
      // console.log('estimatedGas', estimatedGas);

      // console.log('assetManagerContract', assetManagerContract);

      // console.log('estimating gas');

      // const estimatedGas = await assetManagerContract.estimateGas
      //   .deposit([tokenAddress, amount, destination, '0x'], {
      //     account,
      //   })
      //   .catch((error: any) => {
      //     console.error('error', error);
      //   });

      // console.log('estimatedGas', estimatedGas);

      // console.log('simulateContract', avalanche.contracts.assetManager);
      // console.log('account', account);
      // console.log('tokenAddress', tokenAddress);
      // console.log('destination', destination);
      const { request } = await this.publicClient.simulateContract({
        account: account as `0x${string}`,
        address: avalanche.contracts.assetManager as `0x${string}`,
        abi: assetManagerContractAbi,
        functionName: 'deposit',
        args: [tokenAddress as `0x${string}`, amount, '0x1.icon/hxb9ceac1faf1265741f4485a586af82502af0cc18'],
        // use fetched protocol fee
        value: parseEther('0.03'),
      });

      const hash = await this.walletClient.writeContract(request);

      console.log('hash', hash);
    }
  }
}
