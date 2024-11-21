import { Percent } from '@balancednetwork/sdk-core';
import bnJs from '../icon/bnJs';

import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';

import { XWalletClient } from '@/xwagmi/core/XWalletClient';
import { toBytes } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData } from '../../xcall/utils';
import { SolanaXService } from './SolanaXService';
import { ComputeBudgetProgram, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { solana } from '@/xwagmi/constants/xChains';
import { Program } from '@coral-xyz/anchor';

import assetManagerIdl from './idls/assetManager.json';
import bnUSDIdl from './idls/bnUSD.json';
import * as anchor from '@coral-xyz/anchor';
import { fetchMintToken, findPda, getConnectionAccounts, getXCallAccounts } from './utils';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { isNativeXToken } from '@/xwagmi/constants/xTokens';

const createAssociatedTokenTx = account => {
  const bnUSDMint = new PublicKey(solana.contracts.bnUSD!);
  const associatedToken = getAssociatedTokenAddressSync(
    bnUSDMint,
    new PublicKey(account),
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      new PublicKey(account), // payer.publicKey,
      associatedToken,
      new PublicKey(account), // owner,
      bnUSDMint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  );
  return tx;
};

const COMPUTE_UNIT_LIMIT = 1_000_000;

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

    const isNative = isNativeXToken(inputAmount.currency);
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txSignature;

    const assetManagerId = new PublicKey(solana.contracts.assetManager);
    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);
    const bnUSDId = new PublicKey(solana.contracts.bnUSD!);

    if (isNative) {
      const amount = inputAmount.quotient.toString();

      // @ts-ignore
      const assetManagerProgram = new Program(assetManagerIdl, provider);

      const vaultNativePda = await findPda(['vault_native'], assetManagerId);
      const statePda = await findPda(['state'], assetManagerId);
      const xCallManagerStatePda = await findPda(['state'], xCallManagerId);
      const xCallConfigPda = await findPda(['config'], xCallId);
      const xCallAuthorityPda = await findPda(['dapp_authority'], assetManagerId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = await getConnectionAccounts('0x1.icon', xCallManagerId, provider);

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
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
        .remainingAccounts([...xCallAccounts, ...connectionAccounts])
        .instruction();

      tx.add(instruction);

      txSignature = await wallet.sendTransaction(tx, connection);
    } else if (isBnUSD) {
      const amount = inputAmount.quotient * 1_000_000_000n + '';

      // @ts-ignore
      const bnUSDProgram = new Program(bnUSDIdl, provider);

      const mintToken = await fetchMintToken(bnUSDId, provider);

      const statePda = await findPda(['state'], bnUSDId);
      const xcallManagerStatePda = await findPda(['state'], xCallManagerId);
      const xcallConfigPda = await findPda(['config'], xCallId);
      const xcallAuthorityPda = await findPda(['dapp_authority'], bnUSDId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = await getConnectionAccounts('0x1.icon', xCallManagerId, provider);

      const associatedTokenAcc = getAssociatedTokenAddressSync(mintToken, new PublicKey(account));

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
      const tx = new Transaction().add(computeBudgetIx);

      const crossTransferTx = await bnUSDProgram.methods
        .crossTransfer(destination, new anchor.BN(amount), Buffer.from(data, 'hex'))
        .accounts({
          from: associatedTokenAcc,
          mint: mintToken,
          fromAuthority: new PublicKey(account),
          state: statePda,
          xcallManagerState: xcallManagerStatePda,
          xcallConfig: xcallConfigPda,
          xcall: xCallId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          xcallAuthority: xcallAuthorityPda,
        })
        .remainingAccounts([...xCallAccounts, ...connectionAccounts])
        .instruction();

      tx.add(crossTransferTx);

      txSignature = await wallet.sendTransaction(tx, connection);
    }

    console.log('txSignature', txSignature);

    if (txSignature) {
      return txSignature;
    }
  }

  async _executeDepositCollateral(xTransactionInput: XTransactionInput) {}

  async _executeWithdrawCollateral(xTransactionInput: XTransactionInput) {}

  async _executeBorrow(xTransactionInput: XTransactionInput) {}

  async _executeRepay(xTransactionInput: XTransactionInput) {}
}
