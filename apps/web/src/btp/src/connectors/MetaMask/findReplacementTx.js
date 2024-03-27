// Author: https://github.com/aurora-is-near/rainbow-bridge-client/tree/main/packages/find-replacement-tx

import { ethers } from 'ethers';

const failedMessage = 'Transaction failed';
export async function getTransactionByNonce(provider, startSearch, from, nonce) {
  const currentNonce = (await provider.getTransactionCount(from, 'latest')) - 1;

  // Transaction still pending
  if (currentNonce < nonce) return null;

  const startSearchNonce = (await provider.getTransactionCount(from, startSearch - 1)) - 1;
  // Check nonce was used inside ]startSearch - 1, 'latest'].
  if (nonce <= startSearchNonce) {
    const error = `Nonce ${nonce} from ${from} is used before block ${startSearch}`;
    console.error(error);
    throw new Error(failedMessage);
  }

  // Binary search the block containing the transaction between startSearch and latest.
  let maxBlock = await provider.getBlockNumber(); // latest: chain head
  let minBlock = startSearch;
  while (minBlock < maxBlock) {
    const middleBlock = Math.floor((minBlock + maxBlock) / 2);
    const middleNonce = (await provider.getTransactionCount(from, middleBlock)) - 1;
    if (middleNonce < nonce) {
      // middleBlock was mined before the tx with broadcasted nonce, so take next block as lower bound
      minBlock = middleBlock + 1;
    } else {
      maxBlock = middleBlock;
    }
  }
  const block = await provider.getBlockWithTransactions(minBlock);
  const transaction = block.transactions.find(
    blockTx => blockTx.from.toLowerCase() === from.toLowerCase() && blockTx.nonce === nonce,
  );
  if (!transaction) {
    throw new Error('Error finding transaction in block.');
  }
  return transaction;
}

export async function findReplacementTx(provider, startSearch, tx, event) {
  const transaction = await getTransactionByNonce(provider, startSearch, tx.from, tx.nonce);

  // Transaction still pending
  if (!transaction) return null;

  if (transaction.data === '0x' && transaction.from === transaction.to && transaction.value.isZero()) {
    const error = 'Transaction canceled.';
    throw new Error(error);
  }

  if (transaction.to.toLowerCase() !== tx.to.toLowerCase()) {
    const error = `Failed to validate transaction recipient.
        Expected ${tx.to}, got ${transaction.to}.
        Transaction was dropped and replaced by '${transaction.hash}'`;

    console.error(error);
    throw new Error(failedMessage);
  }

  if (tx.data) {
    if (transaction.data !== tx.data) {
      const error = `Failed to validate transaction data.
        Expected ${tx.data}, got ${transaction.data}.
        Transaction was dropped and replaced by '${transaction.hash}'`;

      console.error(error);
      throw new Error(failedMessage);
    }
  }

  if (tx.value) {
    if (transaction.value.toString() !== tx.value) {
      const error = `Failed to validate transaction value.
        Expected ${tx.value}, got ${transaction.value.toString()}.
        Transaction was dropped and replaced by '${transaction.hash}'`;

      console.error(error);
      throw new Error(failedMessage);
    }
  }

  if (event) {
    const tokenContract = new ethers.Contract(event.address, event.abi, provider);
    const filter = tokenContract.filters[event.name]();
    const events = await tokenContract.queryFilter(filter, transaction.blockNumber, transaction.blockNumber);
    const foundEvent = events.find(e => e.transactionHash === transaction.hash);
    if (!foundEvent || !event.validate({ returnValues: foundEvent.args })) {
      const error = `Failed to validate event.
        Transaction was dropped and replaced by '${transaction.hash}'`;

      console.error(error);
      throw new Error(failedMessage);
    }
  }
  return transaction;
}
