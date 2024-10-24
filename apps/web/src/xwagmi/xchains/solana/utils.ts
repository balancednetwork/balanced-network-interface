import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { FROM_SOURCES } from '@/xwagmi/constants/xChains';

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

export async function initializeProgram(programId, provider) {
  const idl = await anchor.Program.fetchIdl(programId, provider);
  if (!idl) {
    throw new Error('Failed to fetch IDL for the program.');
  }
  const program = new anchor.Program(idl, provider);
  return program;
}

export async function fetchXCallConfig(programId, provider) {
  try {
    const xcall_program = await initializeProgram(programId, provider);
    const xcall_state = await findPda(['config'], programId);

    // @ts-ignore
    const config = await xcall_program.account.config.fetch(xcall_state);
    return config;
  } catch (error) {}
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

async function fetchCentralizedContracts(xcallManagerId, provider) {
  try {
    const program = await initializeProgram(xcallManagerId, provider);
    const xcall_manager_state = await findPda(['state'], xcallManagerId);

    // @ts-ignore
    const config = await program.account.xmState.fetch(xcall_manager_state);
    console.log('fetchCentralizedContracts config', config);
    return config.sources;
  } catch (error) {}
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
