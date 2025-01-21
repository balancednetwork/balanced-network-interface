import { FROM_SOURCES } from '@/constants/xChains';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import xCallIdl from './idls/xCall.json';

/**
 * Converts a number to a 128-bit unsigned integer array (Big Endian).
 * @param {BigInt | string | number} num
 * @returns {Uint8Array}
 */
export function uint128ToArray(num) {
  if (typeof num === 'string' || typeof num === 'number') {
    num = BigInt(num);
  } else if (!(num instanceof BigInt)) {
    throw new Error('Input must be a BigInt or convertible to a BigInt.');
  }

  const buffer = new ArrayBuffer(16);
  const view = new DataView(buffer);

  view.setBigUint64(0, num >> BigInt(64), false);
  view.setBigUint64(8, num & BigInt('0xFFFFFFFFFFFFFFFF'), false);

  return new Uint8Array(buffer);
}

export function findPda(seeds, programId: PublicKey) {
  // Convert all seeds to buffers
  const buffers = seeds.map(seed => {
    if (typeof seed === 'string') {
      return Buffer.from(seed);
    } else if (Buffer.isBuffer(seed)) {
      return seed;
    } else if (seed instanceof PublicKey) {
      return seed.toBuffer();
    } else if (typeof seed === 'number') {
      return Buffer.from([seed]);
    } else {
      return seed;
    }
  });

  // Find the PDA
  const [pda, bump] = PublicKey.findProgramAddressSync(buffers, programId);

  return pda;
}

export async function fetchXCallConfig(programId, provider) {
  try {
    // @ts-ignore
    const program = new anchor.Program(xCallIdl, provider);
    const configPda = findPda(['config'], programId);

    // @ts-ignore
    const config = await program.account.config.fetch(configPda);
    return config;
  } catch (error) {
    // @ts-ignore
    console.error('Error fetching xCallConfig:', error.message);
  }
}

export async function getXCallAccounts(xcallProgramId, provider) {
  const xcallConfigPda = findPda(['config'], xcallProgramId);
  const xcallConfigAccount = await fetchXCallConfig(xcallProgramId, provider);
  const rollbackPda = findPda(
    ['rollback', uint128ToArray(xcallConfigAccount.sequenceNo.toNumber() + 1)],
    xcallProgramId,
  );

  const xcallAccounts = [
    {
      pubkey: xcallConfigPda,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: rollbackPda,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'),
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: new PublicKey(xcallConfigAccount.feeHandler),
      isSigner: false,
      isWritable: true,
    },
  ];

  return xcallAccounts;
}

export function getConnectionAccounts(nid, xcallManagerId, provider) {
  const centralizedContracts: string[] = FROM_SOURCES['solana'] || [];

  let connectionAccounts: any[] = centralizedContracts.map(contractPubkeyStr => [
    {
      pubkey: new PublicKey(contractPubkeyStr),
      isSigner: false,
      isWritable: true,
    },
    ...[
      {
        pubkey: findPda(['config'], new PublicKey(contractPubkeyStr)),
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: findPda(['fee', nid], new PublicKey(contractPubkeyStr)),
        isSigner: false,
        isWritable: true,
      },
    ],
  ]);

  connectionAccounts = [].concat(...connectionAccounts);

  return connectionAccounts;
}

export async function checkIfAccountInitialized(connection, accountPubkey) {
  const accountInfo = await connection.getAccountInfo(new PublicKey(accountPubkey));
  if (!accountInfo) {
    return false;
  }
  return true;
}
