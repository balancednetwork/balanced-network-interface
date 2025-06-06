import { STELLAR_TRUSTLINE_TOKEN_INFO } from '@/constants/xTokens';
import { useXService } from '@/hooks';
import { XToken } from '@/types/xToken';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import {
  Account,
  Address,
  BASE_FEE,
  Contract,
  Memo,
  MemoType,
  Networks,
  Operation,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  rpc,
  scValToBigInt,
  xdr,
} from '@stellar/stellar-sdk';
import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import CustomSorobanServer from './CustomSorobanServer';
import { StellarXService } from './StellarXService';

export const STELLAR_RLP_MSG_TYPE = { type: 'symbol' };

export const STELLAR_RLP_DATA_TYPE = {
  type: {
    data: ['symbol', null],
  },
};

export const STELLAR_RLP_ENVELOPE_TYPE = {
  type: {
    destinations: ['symbol', null],
    sources: ['symbol', null],
    message: ['symbol', null],
  },
};

export const XLM_CONTRACT_ADDRESS = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';

// Can be used whenever you need an Address argument for a contract method
export const accountToScVal = (account: string) => new Address(account).toScVal();

export const simulateTx = async (
  tx: Transaction<Memo<MemoType>, Operation[]>,
  server: CustomSorobanServer,
): Promise<any> => {
  const response = await server.simulateTransaction(tx);

  if (response !== undefined) {
    return response;
  }

  throw new Error('cannot simulate transaction');
};

// Get the tokens balance
export const getTokenBalance = async (
  address: string,
  tokenId: string,
  txBuilder: TransactionBuilder,
  server: CustomSorobanServer,
) => {
  const params = [accountToScVal(address)];
  const contract = new Contract(tokenId);
  const tx = txBuilder
    .addOperation(contract.call('balance', ...params))
    .setTimeout(TimeoutInfinite)
    .build();

  const result = await simulateTx(tx, server);

  return result.results ? scValToBigInt(xdr.ScVal.fromXDR(result.results[0].xdr, 'base64')) : 0n;
};

export async function sendTX(
  xService: StellarXService,
  accountId: string,
  contractAddress: string,
  contractMethod: string,
  params: xdr.ScVal[],
): Promise<{ hash: string; status: string }> {
  const contract = new Contract(contractAddress);
  // fetch account for simulation
  const sourceAccountForSim = await xService.server.loadAccount(accountId);

  const simulateTx = new TransactionBuilder(sourceAccountForSim, {
    fee: BASE_FEE,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(contract.call(contractMethod, ...params))
    .setTimeout(30)
    .build();

  const simResult = await xService.sorobanServer.simulateTransaction(simulateTx);

  // Calculate total fee including priority fee
  const priorityFee = '600000';
  // minResourceFee is present at runtime per Soroban docs, but not in the SDK type
  const minResourceFee = (simResult as any).minResourceFee || BASE_FEE.toString();
  const totalFee = (BigInt(priorityFee) + BigInt(minResourceFee)).toString();

  // fetch account for actual tx, needed because of request account sequencing
  const sourceAccount = await xService.server.loadAccount(accountId);

  // Rebuild transaction with the higher fee
  const priorityTx = new TransactionBuilder(sourceAccount, {
    fee: totalFee,
    networkPassphrase: Networks.PUBLIC,
  })
    .addOperation(contract.call(contractMethod, ...params))
    .setTimeout(30)
    .build();

  const prioritySimResult = await xService.sorobanServer.simulateTransaction(priorityTx);

  const tx = rpc.assembleTransaction(priorityTx, prioritySimResult).build();

  if (tx) {
    const { signedTxXdr } = await xService.walletsKit.signTransaction(tx.toXDR());
    const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.PUBLIC);
    const { hash } = await xService.sorobanServer.sendTransaction(txToSubmit);

    // Poll for transaction status
    const result = await pollTransaction(hash, xService);
    if (result.status === 'SUCCESS') {
      return { hash, status: 'SUCCESS' };
    } else {
      return { hash: '', status: 'FAILED' };
    }
  } else {
    throw new Error('Failed to send stellar transaction');
  }
}

export const isStellarAddress = (address: string) => {
  try {
    new Address(address);
    return true;
  } catch (e) {
    return false;
  }
};

export type StellarAccountValidation = { ok: true } | { ok: false; error: string };

export function useValidateStellarAccount(address?: string | null): UseQueryResult<StellarAccountValidation> {
  const stellarService = useXService('STELLAR') as StellarXService;
  const [verifiedAddresses, setVerifiedAddresses] = useState<{ [key: string]: boolean }>({});

  return useQuery({
    queryKey: [`stellarAccountValidation`, stellarService, address],
    queryFn: async () => {
      if (typeof address !== 'string') {
        return { ok: true };
      }

      try {
        await stellarService.server.loadAccount(address);
        setVerifiedAddresses(prev => ({ ...prev, [address]: true }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: `Stellar wallet inactive. Add at least 1 XLM from an external source` };
      }
    },
    enabled: typeof address === 'string' && !verifiedAddresses[address],
    refetchInterval: 5000,
  });
}

export type StellarTrustlineValidation = { ok: true } | { ok: false; error: string };

export function useValidateStellarTrustline(
  address?: string | null,
  token?: XToken,
): UseQueryResult<StellarTrustlineValidation> {
  const stellarService = useXService('STELLAR') as StellarXService;

  const checkIfTrustlineExists = (balances, asset_code, asset_issuer) => {
    return balances.some(
      ({ asset_code: code, asset_issuer: issuer }) => code === asset_code && issuer === asset_issuer,
    );
  };

  return useQuery({
    queryKey: [`stellarTrustlineValidation`, stellarService, address, token],
    queryFn: async () => {
      if (!address || !token) {
        return { ok: true };
      }

      const trustlineInfo = STELLAR_TRUSTLINE_TOKEN_INFO.find(info => info.contract_id === token.address);

      if (!trustlineInfo) {
        return { ok: true };
      }

      const { balances } = await stellarService.server.accounts().accountId(address).call();

      if (trustlineInfo && checkIfTrustlineExists(balances, trustlineInfo.asset_code, trustlineInfo.asset_issuer)) {
        console.log(`Trustline already exists for ${token.symbol}`);
        return { ok: true };
      }

      return { ok: false, error: `Trustline does not exist for ${token.symbol}` };
    },
    refetchInterval: 2000,
  });
}

// Poll for transaction result
export const getTransactionResult = async (hash: string, stellarXService: StellarXService): Promise<any> => {
  try {
    const result = await stellarXService.sorobanServer.getTransaction(hash);
    return result;
  } catch (error) {
    console.error('Error getting transaction result:', error);
    return null;
  }
};

// Poll until we get a final status
export const pollTransaction = async (
  hash: string,
  stellarXService: StellarXService,
): Promise<rpc.Api.GetTransactionResponse> => {
  const maxAttempts = 30; // 30 seconds timeout
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getTransactionResult(hash, stellarXService);

    if (result && result.status !== 'PENDING' && result.status !== 'NOT_FOUND') {
      return result;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between polls
    attempts++;
  }

  throw new Error('Transaction timed out.');
};

/**
 * Fetches the XLM balance of a Stellar account
 * @param address The Stellar account address
 * @returns A Promise that resolves to the XLM balance as a string, or undefined if there was an error
 */
export const getXLMBalance = async (address: string): Promise<string | undefined> => {
  try {
    const stellarService = StellarXService.getInstance();
    const account = await stellarService.server.loadAccount(address);

    // Find the native XLM balance in the account's balances
    const xlmBalance = account.balances.find(balance => balance.asset_type === 'native');

    if (xlmBalance) {
      return xlmBalance.balance;
    }

    return undefined;
  } catch (error) {
    console.error('Error fetching XLM balance:', error);
    return undefined;
  }
};

/**
 * React hook to fetch XLM balance
 * @param address The Stellar account address
 * @returns A query result containing the XLM balance as a number
 */
export function useXLMBalance(address: string | undefined): UseQueryResult<number | undefined> {
  return useQuery({
    queryKey: ['xlmBalance', address],
    queryFn: async () => {
      if (!address) return undefined;
      const balance = await getXLMBalance(address);
      return balance ? parseFloat(balance) : undefined;
    },
    enabled: !!address,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
