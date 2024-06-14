import bnJs from 'bnJs';
import { RLP } from '@ethereumjs/rlp';
import { Address, PublicClient, WalletClient, WriteContractParameters, toHex } from 'viem';
import { Percent } from '@balancednetwork/sdk-core';

import { XChainId } from 'app/pages/trade/bridge/types';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { NATIVE_ADDRESS } from 'constants/index';
import { ICON_XCALL_NETWORK_ID } from 'constants/config';

import { XTransactionInput } from '../_zustand/types';
import { IWalletXService } from './types';
import { assetManagerContractAbi } from './abis/assetManagerContractAbi';
import { bnUSDContractAbi } from './abis/bnUSDContractAbi';
import { EvmPublicXService } from './EvmPublicXService';
import { xCallContractAbi } from './abis/xCallContractAbi';
import { uintToBytes } from 'utils';

export class EvmWalletXService extends EvmPublicXService implements IWalletXService {
  walletClient: WalletClient;

  constructor(xChainId: XChainId, publicClient: PublicClient, walletClient: WalletClient, options?: any) {
    super(xChainId, publicClient);
    this.walletClient = walletClient;
  }

  async approve(token, owner, spender, currencyAmountToApprove) {}

  async executeTransfer(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, recipient: destinationAddress, account, xCallFee } = xTransactionInput;

    if (this.walletClient) {
      const tokenAddress = inputAmount.wrapped.currency.address;
      const destination = `${direction.to}/${destinationAddress}`;
      const amount = BigInt(inputAmount.quotient.toString());

      // check if the bridge asset is native
      const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;
      const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

      let request: WriteContractParameters;
      if (isBnUSD) {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: xChainMap[this.xChainId].contracts.bnUSD as Address,
          abi: bnUSDContractAbi,
          functionName: 'crossTransfer',
          args: [destination, amount, '0x'],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        if (!isNative) {
          const res = await this.publicClient.simulateContract({
            account: account as Address,
            address: xChainMap[this.xChainId].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'deposit',
            args: [tokenAddress as Address, amount, destination],
            value: xCallFee.rollback,
          });
          request = res.request;
        } else {
          const res = await this.publicClient.simulateContract({
            account: account as Address,
            address: xChainMap[this.xChainId].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'depositNative',
            args: [amount, destination, '0x'],
            value: xCallFee.rollback + amount,
          });
          request = res.request;
        }
      }
      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }

  async executeSwap(xTransactionInput: XTransactionInput) {
    const { direction, inputAmount, executionTrade, account, recipient, xCallFee, slippageTolerance } =
      xTransactionInput;

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
      const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

      let request: WriteContractParameters;
      if (isBnUSD) {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: xChainMap[this.xChainId].contracts.bnUSD as Address,
          abi: bnUSDContractAbi,
          functionName: 'crossTransfer',
          args: [destination, amount, data],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        if (!isNative) {
          const res = await this.publicClient.simulateContract({
            account: account as Address,
            address: xChainMap[this.xChainId].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'deposit',
            args: [tokenAddress as Address, amount, destination, data],
            value: xCallFee.rollback,
          });
          request = res.request;
        } else {
          const res = await this.publicClient.simulateContract({
            account: account as Address,
            address: xChainMap[this.xChainId].contracts.assetManager as Address,
            abi: assetManagerContractAbi,
            functionName: 'depositNative',
            args: [amount, destination, data],
            value: xCallFee.rollback + amount,
          });
          request = res.request;
        }
      }
      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee } = xTransactionInput;

    if (!inputAmount) {
      return;
    }

    if (this.walletClient) {
      const tokenAddress = inputAmount.wrapped.currency.address;
      const amount = BigInt(inputAmount.quotient.toString());
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
      const data = toHex(JSON.stringify({}));
      // check if the asset is native
      const isNative = inputAmount.currency.wrapped.address === NATIVE_ADDRESS;

      let request: WriteContractParameters;
      if (!isNative) {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: xChainMap[this.xChainId].contracts.assetManager as Address,
          abi: assetManagerContractAbi,
          functionName: 'deposit',
          args: [tokenAddress as Address, amount, destination, data],
          value: xCallFee.rollback,
        });
        request = res.request;
      } else {
        const res = await this.publicClient.simulateContract({
          account: account as Address,
          address: xChainMap[this.xChainId].contracts.assetManager as Address,
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

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const { inputAmount, account, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    if (this.walletClient) {
      const amount = BigInt(inputAmount.multiply(-1).quotient.toString());
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
      const data = toHex(RLP.encode(['xWithdraw', uintToBytes(amount), usedCollateral]));
      const envelope = toHex(
        RLP.encode([
          Buffer.from([0]),
          data,
          FROM_SOURCES[this.xChainId]?.map(Buffer.from),
          TO_SOURCES[this.xChainId]?.map(Buffer.from),
        ]),
      );

      console.log('envelope amount', amount.toString());
      console.log('envelope data', envelope);

      const res = await this.publicClient.simulateContract({
        account: account as Address,
        address: xChainMap[this.xChainId].contracts.xCall as Address,
        abi: xCallContractAbi,
        functionName: 'sendCall',
        args: [destination, envelope],
        //todo
        //? rollback or not
        value: xCallFee.noRollback,
      });

      const request: WriteContractParameters = res.request;
      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    //todo: implement receiver address to receive on different chain than the caller chain/address
    //direction will be used to determine the receiver chain/address
    const { direction, inputAmount, account, xCallFee, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    if (this.walletClient) {
      const amount = BigInt(inputAmount.quotient.toString());
      const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
      const data = toHex(RLP.encode(['xBorrow', usedCollateral, uintToBytes(amount)]));
      const envelope = toHex(
        RLP.encode([
          0,
          data,
          FROM_SOURCES[this.xChainId]?.map(Buffer.from),
          TO_SOURCES[this.xChainId]?.map(Buffer.from),
        ]),
      );

      const res = await this.publicClient.simulateContract({
        account: account as Address,
        address: xChainMap[this.xChainId].contracts.xCall as Address,
        abi: xCallContractAbi,
        functionName: 'sendCall',
        args: [destination, envelope],
        //todo
        //? rollback or not
        value: xCallFee.noRollback,
      });

      const request: WriteContractParameters = res.request;
      const hash = await this.walletClient.writeContract(request);

      if (hash) {
        return hash;
      }
    }
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    //todo: executeRepay EVM
    return Promise.resolve('todo');
  }
}
