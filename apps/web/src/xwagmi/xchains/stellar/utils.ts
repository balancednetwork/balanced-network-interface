import {
  Address,
  BASE_FEE,
  Contract,
  Memo,
  MemoType,
  Networks,
  Operation,
  SorobanRpc,
  TimeoutInfinite,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  scValToBigInt,
  scValToNative,
  xdr,
} from '@stellar/stellar-sdk';
import CustomSorobanServer from './CustomSorobanServer';

export const XLM_CONTRACT_ADDRESS = 'CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA';

export const SendTxStatus: {
  [index: string]: SorobanRpc.Api.SendTransactionStatus;
} = {
  Pending: 'PENDING',
  Duplicate: 'DUPLICATE',
  Retry: 'TRY_AGAIN_LATER',
  Error: 'ERROR',
};

// Can be used whenever you need an Address argument for a contract method
export const accountToScVal = (account: string) => new Address(account).toScVal();

// Can be used whenever you need an i128 argument for a contract method
export const numberToI128 = (value: number): xdr.ScVal => nativeToScVal(value, { type: 'i128' });

// Get a TransactionBuilder configured with our public key
export const getTxBuilder = async (
  pubKey: string,
  fee: string,
  server: CustomSorobanServer,
  networkPassphrase = Networks.PUBLIC,
) => {
  const source = await server.getAccount(pubKey);
  return new TransactionBuilder(source, {
    fee,
    networkPassphrase,
  });
};

//  Can be used whenever we need to perform a "read-only" operation
//  Used in getTokenSymbol, getTokenName, getTokenDecimals, and getTokenBalance
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

// Build and submits a transaction to the Soroban RPC
// Polls for non-pending state, returns result after status is updated
export const submitTx = async (signedXDR: string, networkPassphrase: string, server: CustomSorobanServer) => {
  const tx = TransactionBuilder.fromXDR(signedXDR, networkPassphrase);

  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.errorResult) {
    throw new Error('unable to submit transaction');
  }

  if (sendResponse.status === SendTxStatus.Pending) {
    let txResponse = await server.getTransaction(sendResponse.hash);

    // Poll this until the status is not "NOT_FOUND"
    while (txResponse.status === SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
      // See if the transaction is complete
      // eslint-disable-next-line no-await-in-loop
      txResponse = await server.getTransaction(sendResponse.hash);
      // Wait a second
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (txResponse.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return txResponse.resultXdr.toXDR('base64');
    }
    // eslint-disable-next-line no-else-return
  }
  throw new Error(`Unabled to submit transaction, status: ${sendResponse.status}`);
};

// Function to decode a base64 string to an i128 value
// function decodeI128(base64String: string): bigint {
//   // Decode the base64 string to a buffer
//   const buffer = Buffer.from(base64String, 'base64');

//   // Decode the buffer to an XDR Int128 object
//   const int128 = xdr.Int128Parts.fromXDR(buffer);

//   // Convert the XDR Int128 object to a bigint
//   const value = (int128);

//   return value;
// }

// Get the tokens balance, decoded as a string
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

  return scValToBigInt(xdr.ScVal.fromXDR(result.results[0].xdr, 'base64'));
};

// Build a "transfer" operation, and prepare the corresponding XDR
// https://github.com/stellar/soroban-examples/blob/main/token/src/contract.rs#L27
export const makePayment = async (
  tokenId: string,
  amount: number,
  to: string,
  pubKey: string,
  memo: string,
  txBuilder: TransactionBuilder,
  server: CustomSorobanServer,
) => {
  const contract = new Contract(tokenId);
  const tx = txBuilder
    .addOperation(
      contract.call(
        'transfer',
        ...[
          accountToScVal(pubKey), // from
          accountToScVal(to), // to
          numberToI128(amount), // amount
        ],
      ),
    )
    .setTimeout(TimeoutInfinite);

  if (memo.length > 0) {
    tx.addMemo(Memo.text(memo));
  }

  const preparedTransaction = await server.prepareTransaction(tx.build());

  return preparedTransaction.toXDR();
};

export const getEstimatedFee = async (
  tokenId: string,
  amount: number,
  to: string,
  pubKey: string,
  memo: string,
  txBuilder: TransactionBuilder,
  server: CustomSorobanServer,
) => {
  const contract = new Contract(tokenId);
  const tx = txBuilder
    .addOperation(
      contract.call(
        'transfer',
        ...[
          accountToScVal(pubKey), // from
          accountToScVal(to), // to
          numberToI128(amount), // amount
        ],
      ),
    )
    .setTimeout(TimeoutInfinite);

  if (memo.length > 0) {
    tx.addMemo(Memo.text(memo));
  }

  const raw = tx.build();

  const simResponse = await server.simulateTransaction(raw);

  if (SorobanRpc.Api.isSimulationError(simResponse)) {
    throw simResponse.error;
  }

  // 'classic' tx fees are measured as the product of tx.fee * 'number of operations', In soroban contract tx,
  // there can only be single operation in the tx, so can make simplification
  // of total classic fees for the soroban transaction will be equal to incoming tx.fee + minResourceFee.
  const classicFeeNum = parseInt(raw.fee, 10) || 0;
  const minResourceFeeNum = parseInt(simResponse.minResourceFee, 10) || 0;
  const fee = (classicFeeNum + minResourceFeeNum).toString();
  return fee;
};
