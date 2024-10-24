import { XPublicClient } from '@/xwagmi/core/XPublicClient';
import { XChainId, XToken } from '@/xwagmi/types';
import { TransactionStatus, XCallEvent, XTransactionInput } from '../../xcall/types';
import { SolanaXService } from './SolanaXService';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Program } from '@coral-xyz/anchor';
import xCallIdl from './idls/xCall.json';
import { findPda } from './utils';
import { xChainMap } from '@/xwagmi/constants/xChains';

function network_fee(networkId: string, source) {
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('fee'), Buffer.from(networkId)],
    new PublicKey(source),
  );

  return { pda, bump };
}

export class SolanaXPublicClient extends XPublicClient {
  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  getPublicClient(): any {}

  async getBalance(address: string | undefined, xToken: XToken) {
    if (!address) {
      return;
    }

    const connection = this.getXService().connection;

    try {
      if (xToken.isNativeXToken()) {
        const newBalance = await connection.getBalance(new PublicKey(address));
        return CurrencyAmount.fromRawAmount(xToken, BigInt(newBalance));
      } else {
        // const mintAddress = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
        // const address = 'Gza3H3Pw7cdFWpfqaHZvZAaH1rRuuzuhRE4gK96rZKVS';
        // const tokenAccountPubkey = getAssociatedTokenAddressSync(new PublicKey(mintAddress), new PublicKey(address));
        // console.log('tokenAccountPubkey', tokenAccountPubkey.toString());
        // const tokenAccountPubkey = new PublicKey('CebVkrtQKEWsh5iEcgpTpqnHEiY5dis7Lsckx8N2RsMB');
        const tokenAccountPubkey = getAssociatedTokenAddressSync(new PublicKey(xToken.address), new PublicKey(address));
        const tokenAccount = await getAccount(connection, tokenAccountPubkey);
        return CurrencyAmount.fromRawAmount(xToken, BigInt(tokenAccount.amount));
      }
    } catch (e) {
      // console.log(e);
    }
  }

  // TODO implement this
  async getXCallFee(xChainId: XChainId, nid: XChainId, rollback: boolean, sources?: string[]) {
    const provider = this.getXService().provider;
    const xCallId = new PublicKey(xChainMap['solana'].contracts.xCall);

    const configPda = await findPda(['config'], xCallId);

    // @ts-ignore
    const program = new Program(xCallIdl, provider);

    try {
      if (sources && sources.length > 0) {
        const fee = await program.methods
          .getFee(nid, rollback, sources)
          .accountsStrict({
            config: configPda,
          })
          .remainingAccounts([
            ...sources.map(source => ({
              pubkey: network_fee(nid, source).pda,
              isSigner: false,
              isWritable: true,
            })),
            ...sources.map(source => ({
              pubkey: new PublicKey(source),
              isSigner: false,
              isWritable: true,
            })),
          ])
          .view({ commitment: 'confirmed' });

        return BigInt(fee);
      }
    } catch (e) {
      // @ts-ignore
      // console.log(e.simulationResponse);
    }

    // hardcoded
    return 600_000n;
  }

  async getTxReceipt(txHash: string) {
    const connection = this.getXService().connection;
    return await connection.getParsedTransaction(txHash, { maxSupportedTransactionVersion: 0 });
  }

  deriveTxStatus(rawTx): TransactionStatus {
    try {
      if (rawTx.transactionHash) {
        if (rawTx.meta.status.Err) {
          return TransactionStatus.failure;
        } else {
          return TransactionStatus.success;
        }
      }
    } catch (e) {}

    return TransactionStatus.pending;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////
  async getBlockHeight() {
    // const blockHeight = await connection.getBlockHeight();
    return BigInt(0); // not used
  }

  getTxEventLogs(rawTx) {
    return []; // not used
  }

  async getEventLogs(
    xChainId: XChainId,
    { startBlockHeight, endBlockHeight }: { startBlockHeight: bigint; endBlockHeight: bigint },
  ) {
    return []; // not used
  }

  parseEventLogs(eventLogs: any[]): XCallEvent[] {
    return []; // not used
  }

  needsApprovalCheck(xToken: XToken): boolean {
    return false;
  }

  async estimateApproveGas(amountToApprove: CurrencyAmount<XToken>, spender: string, owner: string) {
    return 0n;
  }

  async estimateSwapGas(xTransactionInput: XTransactionInput) {
    // TODO: implement
    return 0n;
  }
}
