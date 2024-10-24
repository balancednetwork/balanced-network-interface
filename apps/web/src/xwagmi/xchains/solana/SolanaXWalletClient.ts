import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';

import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { toBytes } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { SolanaXService } from './SolanaXService';
import { ComputeBudgetProgram, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { isNativeCurrency } from '@/constants/tokens';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { Program } from '@coral-xyz/anchor';

import assetManagerIdl from './idls/assetManager.json';
import xCallIdl from './idls/xCall.json';
import bnUSDIdl from './idls/bnUSD.json';
import * as anchor from '@coral-xyz/anchor';
import { findPda, getConnectionAccounts, getXCallAccounts } from './utils';

export class SolanaXWalletClient extends XWalletClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async executeTransaction(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    console.log('wallet', wallet, connection, provider);

    const { type, executionTrade, account, direction, inputAmount, recipient, slippageTolerance, xCallFee } =
      xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Router.address}`;
    const receiver = `${direction.to}/${recipient}`;
    const amount = inputAmount.quotient.toString();

    let data;
    if (type === XTransactionType.SWAP) {
      if (!executionTrade || !slippageTolerance) {
        return;
      }

      const minReceived = executionTrade.minimumAmountOut(new Percent(slippageTolerance, 10_000));

      const rlpEncodedData = getRlpEncodedSwapData(executionTrade, '_swap', receiver, minReceived);
      data = rlpEncodedData;
    } else if (type === XTransactionType.BRIDGE) {
      data = toBytes(
        JSON.stringify({
          method: '_swap',
          params: {
            path: [],
            receiver: receiver,
          },
        }),
      );
    } else if (type === XTransactionType.DEPOSIT) {
      return await this._executeDepositCollateral(xTransactionInput);
    } else if (type === XTransactionType.WITHDRAW) {
      return await this._executeWithdrawCollateral(xTransactionInput);
    } else if (type === XTransactionType.BORROW) {
      return await this._executeBorrow(xTransactionInput);
    } else if (type === XTransactionType.REPAY) {
      return await this._executeRepay(xTransactionInput);
    } else {
      throw new Error('Invalid XTransactionType');
    }

    // @ts-ignore
    const assetManagerProgram = new Program(assetManagerIdl, provider);

    const isNative = isNativeCurrency(inputAmount.currency);
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txSignature;

    console.log('isNative', isNative, inputAmount);
    if (inputAmount.currency.isNativeXToken()) {
      const assetManagerId = new PublicKey(xChainMap[direction.from].contracts.assetManager);
      const xCallId = new PublicKey(xChainMap[direction.from].contracts.xCall);
      const xCallManagerId = new PublicKey(xChainMap[direction.from].contracts.xCallManager!);

      const vaultNativePda = await findPda(['vault_native'], assetManagerId);
      const statePda = await findPda(['state'], assetManagerId);
      const xCallManagerStatePda = await findPda(['state'], xCallManagerId);
      const xCallConfigPda = await findPda(['config'], xCallId);
      const xCallAuthorityPda = await findPda(['dapp_authority'], assetManagerId);

      const xcallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = await getConnectionAccounts(direction.to, xCallManagerId, provider);

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 });
      const tx = new Transaction().add(computeBudgetIx);

      // @ts-ignore
      const instruction = await assetManagerProgram.methods
        .depositNative(new anchor.BN(amount), destination, Buffer.from(data, 'hex'))
        .accounts({
          // @ts-ignore
          from: null,
          fromAuthority: new PublicKey(account),
          // @ts-ignore
          vaultTokenAccount: null,
          // @ts-ignore
          valultAuthority: null, // Ensure this PDA is correct
          vaultNativeAccount: vaultNativePda,
          state: statePda,
          xcallManagerState: xCallManagerStatePda,
          xcallConfig: xCallConfigPda,
          xcall: xCallId,
          xcallManager: xCallManagerId,
          // @ts-ignore
          tokenProgram: null,
          systemProgram: SystemProgram.programId,
          xcallAuthority: xCallAuthorityPda,
        })
        .remainingAccounts([...xcallAccounts, ...connectionAccounts])
        .instruction();

      tx.add(instruction);

      console.log('tx', tx);
      txSignature = await wallet.sendTransaction(tx, connection);
      console.log('txSignature', txSignature);
    }

    if (txSignature) {
      return txSignature;
    }
  }

  async _executeDepositCollateral(xTransactionInput: XTransactionInput) {}

  async _executeWithdrawCollateral(xTransactionInput: XTransactionInput) {}

  async _executeBorrow(xTransactionInput: XTransactionInput) {}

  async _executeRepay(xTransactionInput: XTransactionInput) {}
}
