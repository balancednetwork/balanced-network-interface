import { FROM_SOURCES, TO_SOURCES, solana } from '@/constants/xChains';
import { DepositParams, SendCallParams, XWalletClient } from '@/core/XWalletClient';
import { Program } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { ComputeBudgetProgram, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { SolanaXService } from './SolanaXService';
import BALNIdl from './idls/BALN.json';
import assetManagerIdl from './idls/assetManager.json';
import bnUSDIdl from './idls/bnUSD.json';
import sICXIdl from './idls/sICX.json';
import xCallIdl from './idls/xCall.json';
import { CallMessage, Envelope, MessageType } from './types';
import { checkIfAccountInitialized, fetchXCallConfig, findPda, getConnectionAccounts, getXCallAccounts } from './utils';

const SYSVAR_INSTRUCTIONS_ID = new PublicKey('Sysvar1nstructions1111111111111111111111111');

const COMPUTE_UNIT_LIMIT = 1_000_000;

const TokenProgramMap = {
  bnUSD: {
    programId: '3JfaNQh3zRyBQ3spQJJWKmgRcXuQrcNrpLH5pDvaX2gG',
    IDL: bnUSDIdl,
  },
  sICX: {
    programId: 'FdgRnNYHH8VGUFdCwSDR4scKMUfM5rcRSwSeG4g3vZe5',
    IDL: sICXIdl,
  },
  BALN: {
    programId: '2mNamZY5bmHCdeogxjSdU5ZXo2KiYanjuxebLaUb7aa7',
    IDL: BALNIdl,
  },
};

export class SolanaXWalletClient extends XWalletClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async _deposit({ account, inputAmount, destination, data, fee }: DepositParams) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    let txSignature;

    const assetManagerId = new PublicKey(solana.contracts.assetManager);
    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);

    if (inputAmount.currency.isNativeToken) {
      const amount = inputAmount.quotient.toString();

      // @ts-ignore
      const assetManagerProgram = new Program(assetManagerIdl, provider);

      const vaultNativePda = findPda(['vault_native'], assetManagerId);
      const statePda = findPda(['state'], assetManagerId);
      const xCallManagerStatePda = findPda(['state'], xCallManagerId);
      const xCallConfigPda = findPda(['config'], xCallId);
      const xCallAuthorityPda = findPda(['dapp_authority'], assetManagerId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = getConnectionAccounts('0x1.icon', xCallManagerId, provider);

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
      const tx = new Transaction().add(computeBudgetIx);

      // @ts-ignore
      const instruction = await assetManagerProgram.methods
        .depositNative(new anchor.BN(amount), destination, data)
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
    } else {
      const assetToken = new PublicKey(inputAmount.currency.address);

      const amount = inputAmount.quotient.toString();

      // @ts-ignore
      const assetManagerProgram = new Program(assetManagerIdl, provider);

      const vaultPda = findPda(['vault', assetToken], assetManagerId);
      const statePda = findPda(['state'], assetManagerId);
      const xCallManagerStatePda = findPda(['state'], xCallManagerId);
      const xCallConfigPda = findPda(['config'], xCallId);
      const xCallAuthorityPda = findPda(['dapp_authority'], assetManagerId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = getConnectionAccounts('0x1.icon', xCallManagerId, provider);

      const depositorTokenAccount = getAssociatedTokenAddressSync(assetToken, new PublicKey(account), true);
      const vaultTokenAccount = getAssociatedTokenAddressSync(assetToken, vaultPda, true);

      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
      const tx = new Transaction().add(computeBudgetIx);

      if (!(await checkIfAccountInitialized(connection, vaultTokenAccount))) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            new PublicKey(account), // payer.publicKey,
            vaultTokenAccount,
            new PublicKey(vaultPda), // owner,
            assetToken,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      }

      // @ts-ignore
      const instruction = await assetManagerProgram.methods
        .depositToken(new anchor.BN(amount), destination, data)
        .accounts({
          from: depositorTokenAccount,
          fromAuthority: new PublicKey(account),
          vaultTokenAccount: vaultTokenAccount,
          valultAuthority: vaultPda, // Ensure this PDA is correct
          // @ts-ignore
          vaultNativeAccount: null,
          state: statePda,
          xcallManagerState: xCallManagerStatePda,
          xcallConfig: xCallConfigPda,
          xcall: xCallId,
          xcallManager: xCallManagerId,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          xcallAuthority: xCallAuthorityPda,
        })
        .remainingAccounts([...xCallAccounts, ...connectionAccounts])
        .instruction();

      tx.add(instruction);

      txSignature = await wallet.sendTransaction(tx, connection);
    }

    return txSignature;
  }

  async _crossTransfer({ account, inputAmount, destination, data, fee }: DepositParams) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);
    const amount = inputAmount.quotient * 1_000_000_000n + '';

    // @ts-ignore
    const tokenProgram = new Program(TokenProgramMap[inputAmount.currency.symbol.replace('(old)', '')].IDL, provider);
    const tokenProgramId = new PublicKey(TokenProgramMap[inputAmount.currency.symbol.replace('(old)', '')].programId);
    const mintToken = new PublicKey(inputAmount.currency.address);

    const statePda = findPda(['state'], tokenProgramId);
    const xcallManagerStatePda = findPda(['state'], xCallManagerId);
    const xcallConfigPda = findPda(['config'], xCallId);
    const xcallAuthorityPda = findPda(['dapp_authority'], tokenProgramId);

    const xCallAccounts = await getXCallAccounts(xCallId, provider);
    const connectionAccounts = getConnectionAccounts('0x1.icon', xCallManagerId, provider);

    const associatedTokenAcc = getAssociatedTokenAddressSync(mintToken, new PublicKey(account));

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
    const tx = new Transaction().add(computeBudgetIx);

    const crossTransferTx = await tokenProgram.methods
      .crossTransfer(destination, new anchor.BN(amount), data)
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

    const txSignature = await wallet.sendTransaction(tx, connection);
    return txSignature;
  }

  async _sendCall({ account, sourceChainId, destination, data, fee }: SendCallParams) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    const envelope = new Envelope(
      MessageType.CallMessage,
      new CallMessage(data).encode(),
      FROM_SOURCES[sourceChainId]!,
      TO_SOURCES[sourceChainId]!,
    ).encode();

    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);

    // @ts-ignore
    const xCallProgram = new Program(xCallIdl, provider);

    const xCallConfigPda = await findPda(['config'], xCallId);
    const xCallConfigAccount = await fetchXCallConfig(xCallId, provider);
    const connectionAccounts = await getConnectionAccounts('0x1.icon', xCallManagerId, provider);

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNIT_LIMIT });
    const tx = new Transaction().add(computeBudgetIx);

    // @ts-ignore
    const instruction = await xCallProgram.methods
      .sendCall(Buffer.from(envelope), { '0': destination })
      .accountsStrict({
        systemProgram: SYSTEM_PROGRAM_ID,
        config: xCallConfigPda,
        signer: new PublicKey(account),
        dappAuthority: xCallId,
        // @ts-ignore
        rollbackAccount: null,
        instructionSysvar: SYSVAR_INSTRUCTIONS_ID,
        feeHandler: new PublicKey(xCallConfigAccount.feeHandler),
      })
      .remainingAccounts([...connectionAccounts])
      .instruction();

    tx.add(instruction);

    const txSignature = await wallet.sendTransaction(tx, connection);
    return txSignature;
  }
}
