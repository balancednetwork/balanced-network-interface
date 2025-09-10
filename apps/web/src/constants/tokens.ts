import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { Currency, Token } from '@balancednetwork/sdk-core';

import { TRANSFORMED_COMBINED_TOKEN_LIST, TRANSFORMED_DEFAULT_TOKEN_LIST } from '@/store/lists/hooks';

import { useIconNetworkId } from '@/hooks/useIconNetworkId';
import { NETWORK_ID } from './config';

export const NULL_CONTRACT_ADDRESS = 'cx0000000000000000000000000000000000000000';

export const isNativeCurrency = (token?: Currency): boolean => {
  return !!token && (token as any)?.address === NULL_CONTRACT_ADDRESS;
};

export const useICX = () => {
  const networkId = useIconNetworkId();
  return ICX[networkId];
};

export type TokenMap = { [key: number]: Token };

export const ICX: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX'),
};

export const sICX: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].sicx, 18, 'sICX', 'Staked ICX'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].sicx, 18, 'sICX', 'Staked ICX'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].sicx, 18, 'sICX', 'Staked ICX'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].sicx, 18, 'sICX', 'Staked ICX'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].sicx, 18, 'sICX', 'Staked ICX'),
};

export const wICX: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].wicx, 18, 'wICX', 'Wrapped ICX'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].wicx, 18, 'wICX', 'Wrapped ICX'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].wicx, 18, 'wICX', 'Wrapped ICX'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].wicx, 18, 'wICX', 'Wrapped ICX'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].wicx, 18, 'wICX', 'Wrapped ICX'),
};

export const bnUSD: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD(old)', 'Balanced Dollar'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
};

export const bnUSD_new: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cx0000000000000000000000000000000000000011',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  [ChainId.SEJONG]: new Token(
    ChainId.SEJONG,
    'cx0000000000000000000000000000000000000011',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  [ChainId.YEOUIDO]: new Token(
    ChainId.YEOUIDO,
    'cx0000000000000000000000000000000000000011',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  [ChainId.BERLIN]: new Token(
    ChainId.BERLIN,
    'cx0000000000000000000000000000000000000011',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  [ChainId.LISBON]: new Token(
    ChainId.LISBON,
    'cx0000000000000000000000000000000000000011',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
};

export const SODA: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx0000000000000000000000000000000000000004', 18, 'SODA', 'SODA'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, 'cx0000000000000000000000000000000000000004', 18, 'SODA', 'SODA'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, 'cx0000000000000000000000000000000000000004', 18, 'SODA', 'SODA'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'cx0000000000000000000000000000000000000004', 18, 'SODA', 'SODA'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'cx0000000000000000000000000000000000000004', 18, 'SODA', 'SODA'),
};

export const BALN: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].baln, 18, 'BALN', 'Balance Token'),
};

export const OMM: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx1a29259a59f463a67bb2ef84398b30ca56b5830a', 18, 'OMM', 'Omm Token'),
};

// disable prettier printWidth rule
// prettier-ignore
export const IUSDT: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cx3a36ea1f6b9aa3d2dd9cb68e8987bcc3aabaaa88',
    6,
    'IUSDT',
    'ICON Tether',
  ),
};

export const CFT: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx2e6d0fc0eca04965d06038c8406093337f085fcf', 18, 'CFT', 'Craft'),
};

export const METX: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx369a5f4ce4f4648dfc96ba0c8229be0693b4eca2', 18, 'METX', 'Metanyx'),
};

// disable prettier printWidth rule
// prettier-ignore
export const GBET: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cx6139a27c15f1653471ffba0b4b88dc15de7e3267',
    18,
    'BET',
    'GangstaBet Token',
  ),
};

// disable prettier printWidth rule
// prettier-ignore
export const ETH: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cx288d13e1b63563459a2ac6179f237711f6851cb5',
    18,
    'ETH',
    'Binance Ethereum',
  ),
  [ChainId.LISBON]: new Token(
    ChainId.MAINNET,
    'cx99c79fd6dee53335f686c7f2cb513745622634f2',
    18,
    'TETH',
    'Binance Ethereum',
  ),
};

// disable prettier printWidth rule
// prettier-ignore
export const BTCB: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cx5b5a03cb525a1845d0af3a872d525b18a810acb0',
    18,
    'BTCB',
    'Binance Bitcoin',
  ),
};

const chainId = NETWORK_ID;
export const SUPPORTED_TOKENS_MAP_BY_ADDRESS = Object.keys(TRANSFORMED_DEFAULT_TOKEN_LIST[chainId] ?? {}).reduce<{
  [address: string]: Token;
}>((newMap, address) => {
  newMap[address] = TRANSFORMED_DEFAULT_TOKEN_LIST[chainId][address].token;
  return newMap;
}, {});
SUPPORTED_TOKENS_MAP_BY_ADDRESS[NULL_CONTRACT_ADDRESS] = ICX[chainId];

export const COMBINED_TOKENS_MAP_BY_ADDRESS = Object.keys(TRANSFORMED_COMBINED_TOKEN_LIST[chainId] ?? {}).reduce<{
  [address: string]: Token;
}>((newMap, address) => {
  newMap[address] = TRANSFORMED_COMBINED_TOKEN_LIST[chainId][address].token;
  return newMap;
}, {});
COMBINED_TOKENS_MAP_BY_ADDRESS[NULL_CONTRACT_ADDRESS] = ICX[chainId];

export const SUPPORTED_TOKENS_LIST: Token[] = Object.values(SUPPORTED_TOKENS_MAP_BY_ADDRESS);
export const COMBINED_TOKENS_LIST: Token[] = Object.values(COMBINED_TOKENS_MAP_BY_ADDRESS);

export const FUNDING_TOKENS: { [chainId: number]: Token[] } = {
  [ChainId.MAINNET]: [sICX[ChainId.MAINNET], bnUSD[ChainId.MAINNET], BALN[ChainId.MAINNET]],
  [ChainId.YEOUIDO]: [sICX[ChainId.YEOUIDO], bnUSD[ChainId.YEOUIDO], BALN[ChainId.YEOUIDO]],
  [ChainId.SEJONG]: [sICX[ChainId.SEJONG], bnUSD[ChainId.SEJONG], BALN[ChainId.SEJONG]],
  [ChainId.BERLIN]: [sICX[ChainId.BERLIN], bnUSD[ChainId.BERLIN], BALN[ChainId.BERLIN]],
  [ChainId.LISBON]: [sICX[ChainId.LISBON], bnUSD[ChainId.LISBON], BALN[ChainId.LISBON]],
};

export const FUNDING_TOKENS_LIST = FUNDING_TOKENS[NETWORK_ID];

export const ORACLE_PRICED_TOKENS = ['USDC', 'USDT'];

export const UNTRADEABLE_TOKENS = ['JitoSOL', 'bnUSD'];

//search for Pyth ID here https://hermes.pyth.network/docs/#/rest/price_feeds_metadata
export const PYTH_PRICED_TOKENS: { symbol: string; pythId: string }[] = [
  {
    symbol: 'USDC',
    pythId: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  },
  {
    symbol: 'USDT',
    pythId: '2dc7f272d3010abe4de48755a50fcf5bd9eefd3b4af01d8f39f6c80ae51544fe',
  },
  {
    symbol: 'WETH',
    pythId: '9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a2b85399db8d5000960f6',
  },
  {
    symbol: 'POL',
    pythId: 'ffd11c5a1cfd42f80afb2df4d9f264c15f956d68153335374ec10722edd70472',
  },
  {
    symbol: 'S',
    pythId: 'b2748e718cf3a75b0ca099cb467aea6aa8f7d960b381b3970769b5a2d6be26dc',
  },
  {
    symbol: 'AVAX',
    pythId: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  },
  {
    symbol: 'ETH',
    pythId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  },
  {
    symbol: 'weETH',
    pythId: '9ee4e7c60b940440a261eb54b6d8149c23b580ed7da3139f7f08f4ea29dad395',
  },
  {
    symbol: 'wstETH',
    pythId: '6df640f3b8963d8f8358f791f352b8364513f6ab1cca5ed3f1f7b5448980e784',
  },
  {
    symbol: 'BTC',
    pythId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  },
  {
    symbol: 'BTCB',
    pythId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  },
  {
    symbol: 'BNB',
    pythId: '2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  },
  {
    symbol: 'INJ',
    pythId: '7a5bc1d2b56ad029048cd63964b3ad2776eadf812edc1a43a31406cb54bff592',
  },
  {
    symbol: 'XLM',
    pythId: 'b7a8eba68a997cd0210c2e1e4ee811ad2d174b3611c22d9ebf16f4cb7e9ba850',
  },
  {
    symbol: 'SOL',
    pythId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  },
  {
    symbol: 'SUI',
    pythId: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  },
  {
    symbol: 'afSUI',
    pythId: '17cd845b16e874485b2684f8b8d1517d744105dbb904eec30222717f4bc9ee0d',
  },
  {
    symbol: 'haSUI',
    pythId: '6120ffcf96395c70aa77e72dcb900bf9d40dccab228efca59a17b90ce423d5e8',
  },
  {
    symbol: 'vSUI',
    pythId: '57ff7100a282e4af0c91154679c5dae2e5dcacb93fd467ea9cb7e58afdcfde27',
  },
];

export const STABLE_TOKENS = ['bnUSD', 'USDC', 'USDT'];
