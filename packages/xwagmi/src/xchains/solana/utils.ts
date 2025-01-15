import { FROM_SOURCES } from '@/constants/xChains';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';

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

export async function findPda(seeds, programId) {
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

export async function initializeProgram(programId: anchor.Address, provider: anchor.Provider) {
  const idl = await anchor.Program.fetchIdl(programId, provider);
  if (!idl) {
    throw new Error('Failed to fetch IDL for the program.');
  }
  const program = new anchor.Program(idl, provider);
  return program;
}

export async function fetchXCallConfig(programId, provider) {
  try {
    const program = await initializeProgram(programId, provider);
    const configPda = await findPda(['config'], programId);

    // @ts-ignore
    const config = await program.account.config.fetch(configPda);
    return config;
  } catch (error) {
    // @ts-ignore
    console.error('Error fetching xCallConfig:', error.message);
  }
}

export async function fetchMintToken(programId: anchor.Address, provider: anchor.Provider) {
  try {
    const program = await initializeProgram(programId, provider);
    const statePda = await findPda(['state'], programId);

    // @ts-ignore
    const state = await program.account.state.fetch(statePda);

    if (programId === '3JfaNQh3zRyBQ3spQJJWKmgRcXuQrcNrpLH5pDvaX2gG') {
      return state.bnUSDToken;
    } else {
      return state.spokeTokenAddr;
    }
  } catch (error) {
    // @ts-ignore
    console.error('Error fetching mintToken:', error.message);
  }
}

export async function getXCallAccounts(xcallProgramId, provider) {
  const xcallConfigPda = await findPda(['config'], xcallProgramId);
  const xcallConfigAccount = await fetchXCallConfig(xcallProgramId, provider);
  const rollbackPda = await findPda(
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

export async function getConnectionAccounts(nid, xcallManagerId, provider) {
  const centralizedContracts: string[] = FROM_SOURCES['solana'] || [];

  let connectionAccounts: any[] = await Promise.all(
    centralizedContracts.map(async contractPubkeyStr => [
      {
        pubkey: new PublicKey(contractPubkeyStr),
        isSigner: false,
        isWritable: true,
      },
      ...[
        {
          pubkey: await findPda(['config'], new PublicKey(contractPubkeyStr)),
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: await findPda(['fee', nid], new PublicKey(contractPubkeyStr)),
          isSigner: false,
          isWritable: true,
        },
      ],
    ]),
  );
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
