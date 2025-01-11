import { CurrencyAmount, MaxUint256 } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import { Address, PublicClient, WalletClient, erc20Abi, getContract, toHex } from 'viem';

import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { XToken } from '@/types';
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

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const walletClient = await this.getWalletClient();

    const amount = BigInt(inputAmount.quotient.toString());

    if (!inputAmount.currency.isNativeToken) {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[inputAmount.currency.xChainId].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'deposit',
        args: [inputAmount.currency.address as Address, amount, destination, toHex(data)],
        value: fee,
      });
      const hash = await walletClient.writeContract(res.request);
      return hash;
    } else {
      const res = await this.getPublicClient().simulateContract({
        account: account as Address,
        address: xChainMap[inputAmount.currency.xChainId].contracts.assetManager as Address,
        abi: assetManagerContractAbi,
        functionName: 'depositNative',
        args: [amount, destination, toHex(data)],
        value: fee + amount,
      });
      const hash = await walletClient.writeContract(res.request);
      return hash;
    }
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const walletClient = await this.getWalletClient();

    const amount = BigInt(inputAmount.quotient.toString());

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: inputAmount.currency.address as Address,
      abi: bnUSDContractAbi,
      functionName: 'crossTransfer',
      args: [destination, amount, toHex(data)],
      value: fee,
    });
    const hash = await walletClient.writeContract(res.request);
    return hash;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const envelope = toHex(
      RLP.encode([
        Buffer.from([0]),
        toHex(data),
        FROM_SOURCES[sourceChainId]?.map(Buffer.from),
        TO_SOURCES[sourceChainId]?.map(Buffer.from),
      ]),
    );

    const res = await this.getPublicClient().simulateContract({
      account: account as Address,
      address: xChainMap[sourceChainId].contracts.xCall as Address,
      abi: xCallContractAbi,
      functionName: 'sendCall',
      args: [destination, envelope],
      value: fee,
    });

    const walletClient = await this.getWalletClient();
    const hash = await walletClient.writeContract(res.request);
    return hash;
  }
}
