import { CurrencyAmount, MaxUint256, Percent } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import { Address, PublicClient, WalletClient, WriteContractParameters, erc20Abi, getContract, toHex } from 'viem';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID, xTokenMap, xTokenMapBySymbol } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
import { uintToBytes } from '@/utils';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '../../xcall/utils';
import { isSpokeToken } from '../archway/utils';
import { EvmXService } from './EvmXService';
import { assetManagerContractAbi } from './abis/assetManagerContractAbi';
import { bnUSDContractAbi } from './abis/bnUSDContractAbi';
import { xCallContractAbi } from './abis/xCallContractAbi';
import { getStakeData, getUnStakeData, getXRemoveData } from './utils';

export class EvmXWalletClient extends XWalletClient {
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
    return publicClient as PublicClient;
  }

  async getWalletClient(): Promise<WalletClient> {
    const walletClient = await this.getXService().getWalletClient(this.getChainId());
    if (!walletClient) {
      throw new Error('EvmXWalletClient: walletClient is not initialized yet');
    }
    return walletClient;
  }

  async approve(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    const xToken = amountToApprove.currency;

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const tokenContract = getContract({
      abi: erc20Abi,
      address: xToken.address as Address,
      client: { public: publicClient, wallet: walletClient },
    });
    const account = owner as Address;
    const { request } = await tokenContract.simulate.approve(
      [spender as `0x${string}`, amountToApprove?.quotient ? BigInt(amountToApprove.quotient.toString()) : MaxUint256],
      { account },
    );

    const hash = await walletClient.writeContract({ ...request, account });
    return hash;
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, recipient, account, xCallFee, executionTrade, slippageTolerance } =
      xTransactionInput;

    console.log('type', type);

    const receiver = `${direction.to}/${recipient}`;
    const tokenAddress = inputAmount.wrapped.currency.address;
    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;

    let data: Address;
    switch (type) {
      case XTransactionType.SWAP: {
        if (!executionTrade || !slippageTolerance) {
          return;
        }
        const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));
        const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived).toString('hex');
        data = `0x${rlpEncodedData}`;
        break;
      }
      case XTransactionType.BRIDGE:
        data = toHex(
          JSON.stringify({
            method: '_swap',
            params: {
              path: [],
              receiver: receiver,
            },
          }),
        );
        break;
      default:
        throw new Error('Invalid XTransactionType');
    }

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const _isSpokeToken = isSpokeToken(inputAmount.currency);
    const isNative = inputAmount.currency.isNativeToken;

    let request: WriteContractParameters;
    if (_isSpokeToken) {
      const tokenAddr = xTokenMap[direction.from].find(token => token.symbol === inputAmount.currency.symbol)?.address;
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: tokenAddr as Address,
        abi: bnUSDContractAbi,
        functionName: 'crossTransfer',
        args: [destination, amount, data],
        value: xCallFee.rollback,
      });
      request = res.request;
    } else {
      if (!isNative) {
        const res = await this.getPublicClient().simulateContract({
          account: account as Address,
          address: xChainMap[direction.from].contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'deposit',
          args: [tokenAddress as Address, amount, destination, data],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        const res = await this.getPublicClient().simulateContract({
          account: account as Address,
          address: xChainMap[direction.from].contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'depositNative',
          args: [amount, destination, data],
          value: xCallFee.rollback + amount,
        });
        request = res.request;
      }
    }

    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
    return undefined;
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, direction } = xTransactionInput;

    if (!inputAmount) {
      return;
    }

    const tokenAddress = inputAmount.wrapped.currency.address;
    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(JSON.stringify({}));

    const isNative = inputAmount.currency.isNativeToken;

    let request: WriteContractParameters;
    if (!isNative) {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[direction.from].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'deposit',
        args: [tokenAddress as Address, amount, destination, data],
        value: xCallFee.rollback,
      });
      request = res.request;
    } else {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[direction.from].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'depositNative',
        args: [amount, destination, data],
        value: xCallFee.rollback + amount,
      });
      request = res.request;
    }

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
    return undefined;
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));
    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[direction.from]?.map(Buffer.from),
        TO_SOURCES[direction.from]?.map(Buffer.from),
      ]),
    );

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: xChainMap[direction.from].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      //todo
      //? rollback or not
      value: xCallFee.noRollback,
    });

    const request: WriteContractParameters = res.request;

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
    return undefined;
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      RLP.encode(
        recipient
          ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
          : ['xBorrow', usedCollateral, uintToBytes(amount)],
      ),
    );
    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[direction.from]?.map(Buffer.from),
        TO_SOURCES[direction.from]?.map(Buffer.from),
      ]),
    );

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: xChainMap[direction.from].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      //todo
      //? rollback or not
      value: xCallFee.noRollback,
    });

    const request: WriteContractParameters = res.request;

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
    return undefined;
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral, recipient, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = BigInt(inputAmount.multiply(-1).quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data = toHex(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: xChainMap[direction.from].contracts.bnUSD as Address,
      abi: bnUSDContractAbi,
      functionName: 'crossTransfer',
      args: [destination, amount, data],
      value: xCallFee.rollback,
    });

    const request: WriteContractParameters = res.request;
    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
    return undefined;
  }

  // liquidity related
  async depositXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(
      JSON.stringify({
        method: '_deposit',
        params: {},
      }),
    );

    const _isSpokeToken = isSpokeToken(inputAmount.currency);
    const isNative = inputAmount.currency.isNativeToken;

    let hash;
    if (_isSpokeToken) {
      const res = await publicClient.simulateContract({
        account: account as Address,
        address: xTokenMapBySymbol[this.xChainId][inputAmount.currency.symbol].address as Address,
        abi: bnUSDContractAbi,
        functionName: 'crossTransfer',
        args: [destination, amount, data],
        value: xCallFee.rollback,
      });
      hash = await walletClient.writeContract(res.request);
    } else {
      if (!isNative) {
        throw new Error('not implemented');
      } else {
        throw new Error('not implemented');
      }
    }

    return hash;
  }

  async withdrawXToken(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, xCallFee } = xTransactionInput;

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const xTokenOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const data = toHex(
      RLP.encode([
        'xWithdraw',
        xTokenOnIcon.address, //
        uintToBytes(amount),
      ]),
    );

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });
    const hash = await walletClient.writeContract(res.request);

    return hash;
  }

  async addLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, outputAmount, xCallFee } = xTransactionInput;

    if (!outputAmount) {
      throw new Error('outputAmount is required');
    }

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amountA = BigInt(inputAmount.quotient.toString());
    const amountB = BigInt(outputAmount.quotient.toString());
    const xTokenAOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][inputAmount.currency.symbol];
    const xTokenBOnIcon = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID][outputAmount.currency.symbol];
    const data = toHex(
      RLP.encode([
        'xAdd',
        xTokenAOnIcon.address,
        xTokenBOnIcon.address,
        uintToBytes(amountA),
        uintToBytes(amountB),
        uintToBytes(1n),
        uintToBytes(1_000n),
      ]),
    );

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async removeLiquidity(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getXRemoveData(poolId, amount, true));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async stake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Dex.address}`;
    const amount = BigInt(inputAmount.quotient.toString());

    const data = toHex(getStakeData(`${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`, poolId, amount));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async unstake(xTransactionInput: XTransactionInput) {
    const { account, inputAmount, poolId, xCallFee } = xTransactionInput;

    if (!poolId) {
      throw new Error('poolId is required');
    }

    const publicClient = this.getPublicClient();
    const walletClient = await this.getWalletClient();

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.StakedLP.address}`;
    const amount = BigInt(inputAmount.quotient.toString());
    const data = toHex(getUnStakeData(poolId, amount));

    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        data,
        FROM_SOURCES[this.xChainId]?.map(Buffer.from),
        TO_SOURCES[this.xChainId]?.map(Buffer.from),
      ]),
    );

    const res = await publicClient.simulateContract({
      account: account as Address,
      address: xChainMap[this.xChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: xCallFee.rollback,
    });

    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
