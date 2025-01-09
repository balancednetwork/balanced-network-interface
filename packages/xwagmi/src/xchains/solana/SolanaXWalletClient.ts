import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, solana } from '@/constants/xChains';
import { XWalletClient } from '@/core/XWalletClient';
import { uintToBytes } from '@/utils';
import { Percent } from '@balancednetwork/sdk-core';
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
import * as rlp from 'rlp';
import { toBytes } from 'viem';
import { XTransactionInput, XTransactionType } from '../../xcall/types';
import { getRlpEncodedSwapData, toICONDecimals } from '../../xcall/utils';
import bnJs from '../icon/bnJs';
import { SolanaXService } from './SolanaXService';
import assetManagerIdl from './idls/assetManager.json';
import bnUSDIdl from './idls/bnUSD.json';
import xCallIdl from './idls/xCall.json';
import { CallMessage, Envelope, MessageType } from './types';
import {
  checkIfAccountInitialized,
  fetchMintToken,
  fetchXCallConfig,
  findPda,
  getConnectionAccounts,
  getXCallAccounts,
} from './utils';

const SYSVAR_INSTRUCTIONS_ID = new PublicKey('Sysvar1nstructions1111111111111111111111111');

const COMPUTE_UNIT_LIMIT = 1_000_000;

export class SolanaXWalletClient extends XWalletClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async approve(amountToApprove, spender, owner) {
    return Promise.resolve(undefined);
  }

  async executeSwapOrBridge(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

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
    } else {
      throw new Error('Invalid XTransactionType');
    }

    const isNative = inputAmount.currency.isNativeToken;
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
    } else {
      const assetToken = new PublicKey(inputAmount.currency.address);

      const amount = inputAmount.quotient.toString();

      // @ts-ignore
      const assetManagerProgram = new Program(assetManagerIdl, provider);

      const vaultPda = await findPda(['vault', assetToken], assetManagerId);
      const statePda = await findPda(['state'], assetManagerId);
      const xCallManagerStatePda = await findPda(['state'], xCallManagerId);
      const xCallConfigPda = await findPda(['config'], xCallId);
      const xCallAuthorityPda = await findPda(['dapp_authority'], assetManagerId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = await getConnectionAccounts('0x1.icon', xCallManagerId, provider);

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
        .depositToken(new anchor.BN(amount), destination, Buffer.from(data, 'hex'))
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

    if (txSignature) {
      return txSignature;
    }
  }

  async executeDepositCollateral(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    const { account, inputAmount } = xTransactionInput;

    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data: any = toBytes(JSON.stringify({}));

    const isNative = inputAmount.currency.isNativeToken;
    const isBnUSD = inputAmount.currency.symbol === 'bnUSD';

    let txSignature;

    const assetManagerId = new PublicKey(solana.contracts.assetManager);
    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);

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
    } else if (!isBnUSD) {
      // JITOSOL
      const amount = inputAmount.quotient.toString();

      const assetToken = new PublicKey(inputAmount.currency.address);

      // @ts-ignore
      const assetManagerProgram = new Program(assetManagerIdl, provider);

      const vaultPda = await findPda(['vault', assetToken], assetManagerId);
      const statePda = await findPda(['state'], assetManagerId);
      const xCallManagerStatePda = await findPda(['state'], xCallManagerId);
      const xCallConfigPda = await findPda(['config'], xCallId);
      const xCallAuthorityPda = await findPda(['dapp_authority'], assetManagerId);

      const xCallAccounts = await getXCallAccounts(xCallId, provider);
      const connectionAccounts = await getConnectionAccounts('0x1.icon', xCallManagerId, provider);

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
        .depositToken(new anchor.BN(amount), destination, Buffer.from(data, 'hex'))
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

    if (txSignature) {
      return txSignature;
    }
  }

  async executeWithdrawCollateral(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;
    const { inputAmount, account, usedCollateral, direction } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = toICONDecimals(inputAmount.multiply(-1));
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;

    const data = rlp.encode(['xWithdraw', uintToBytes(amount), usedCollateral]);
    const envelope = new Envelope(
      MessageType.CallMessage,
      new CallMessage(data).encode(),
      FROM_SOURCES[direction.from]!,
      TO_SOURCES[direction.from]!,
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
    if (txSignature) {
      return txSignature;
    }
  }

  async executeBorrow(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;
    const { inputAmount, account, usedCollateral, direction, recipient } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = BigInt(inputAmount.quotient.toString());
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;

    const data = rlp.encode(
      recipient
        ? ['xBorrow', usedCollateral, uintToBytes(amount), Buffer.from(recipient)]
        : ['xBorrow', usedCollateral, uintToBytes(amount)],
    );
    const envelope = new Envelope(
      MessageType.CallMessage,
      new CallMessage(data).encode(),
      FROM_SOURCES[direction.from]!,
      TO_SOURCES[direction.from]!,
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
    if (txSignature) {
      return txSignature;
    }
  }

  async executeRepay(xTransactionInput: XTransactionInput) {
    const wallet = this.getXService().wallet;
    const connection = this.getXService().connection;
    const provider = this.getXService().provider;

    const { account, inputAmount, recipient, usedCollateral } = xTransactionInput;

    if (!inputAmount || !usedCollateral) {
      return;
    }

    const amount = inputAmount.multiply(-1).quotient.toString();
    const destination = `${ICON_XCALL_NETWORK_ID}/${bnJs.Loans.address}`;
    const data: any = toBytes(
      JSON.stringify(recipient ? { _collateral: usedCollateral, _to: recipient } : { _collateral: usedCollateral }),
    );
    let txSignature;

    const xCallId = new PublicKey(solana.contracts.xCall);
    const xCallManagerId = new PublicKey(solana.contracts.xCallManager!);
    const bnUSDId = new PublicKey(solana.contracts.bnUSD!);

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

    if (txSignature) {
      return txSignature;
    }
  }

  async depositXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async withdrawXToken(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async addLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async removeLiquidity(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async stake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async unstake(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
  async claimRewards(xTransactionInput: XTransactionInput): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
