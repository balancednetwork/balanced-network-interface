import { Percent } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import { Address, PublicClient, WalletClient, WriteContractParameters, toHex } from 'viem';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/constants/config';
import { NATIVE_ADDRESS } from '@/constants/index';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { uintToBytes } from '@/xwagmi/utils';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '../../xcall/utils';
import { EvmXService } from './EvmXService';
import { assetManagerContractAbi } from './abis/assetManagerContractAbi';
import { bnUSDContractAbi } from './abis/bnUSDContractAbi';
import { xCallContractAbi } from './abis/xCallContractAbi';

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
    return publicClient;
  }

  async getWalletClient(): Promise<WalletClient> {
    const walletClient = await this.getXService().getWalletClient(this.getChainId());
    if (!walletClient) {
      throw new Error('EvmXWalletClient: walletClient is not initialized yet');
    }
    return walletClient;
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const { type, direction, inputAmount, recipient, account, xCallFee, executionTrade, slippageTolerance } =
      xTransactionInput;

    const receiver = `${direction.to}/${recipient}`;
    const tokenAddress = inputAmount.wrapped.currency.address;
    const amount = BigInt(inputAmount.quotient.toString());
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
    } else if (type === XTransactionType.DEPOSIT) {
      return await this.executeDepositCollateral(xTransactionInput);
    } else if (type === XTransactionType.WITHDRAW) {
      return await this.executeWithdrawCollateral(xTransactionInput);
    } else if (type === XTransactionType.BORROW) {
      return await this.executeBorrow(xTransactionInput);
    } else if (type === XTransactionType.REPAY) {
      return await this.executeRepay(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }

    // check if the bridge asset is native
    const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let request: WriteContractParameters;
    if (isBnUSD) {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[direction.from].contracts.bnUSD as Address,
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

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(request);

    if (hash) {
      return hash;
    }
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
    // check if the asset is native
    const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;

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
  }
}
