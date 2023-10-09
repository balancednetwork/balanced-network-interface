import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { Token, Currency } from '@balancednetwork/sdk-core';
import { useIconReact } from 'packages/icon-react';

import { TRANSFORMED_DEFAULT_TOKEN_LIST, TRANSFORMED_COMBINED_TOKEN_LIST } from 'store/lists/hooks';

import { NETWORK_ID } from './config';

export const NULL_CONTRACT_ADDRESS = 'cx0000000000000000000000000000000000000000';

export const isNativeCurrency = (token?: Currency): boolean => {
  return !!token && (token as any)?.address === NULL_CONTRACT_ADDRESS;
};

export const isBALN = (token?: Token): boolean => {
  return !!token && BALN[token.chainId]?.address === token.address;
};

export const isFIN = (token?: Token): boolean => {
  return !!token && FIN[token.chainId]?.address === token.address;
};

export const useICX = () => {
  const { networkId: chainId } = useIconReact();
  return ICX[chainId];
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

export const bnUSD: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
};

export const BALN: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, addresses[ChainId.MAINNET].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, addresses[ChainId.SEJONG].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, addresses[ChainId.YEOUIDO].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, addresses[ChainId.BERLIN].baln, 18, 'BALN', 'Balance Token'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, addresses[ChainId.LISBON].baln, 18, 'BALN', 'Balance Token'),
};

// disable prettier printWidth rule
// prettier-ignore
export const IUSDC: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cxae3034235540b924dfcc1b45836c293dcc82bfb7', 6, 'IUSDC', 'ICON USD Coin'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, 'cx65f639254090820361da483df233f6d0e69af9b7', 6, 'IUSDC', 'ICON USD Coin'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, 'cx599d58885e5b1736c934fca7e53e04c797ab05be', 6, 'IUSDC', 'ICON USD Coin'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'cx538a925f49427d4f1078aed638c8cb525071fc68', 6, 'IUSDC', 'ICON USD Coin'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'cx9634be155fc77754c4b2e1bceddc1c63d973f1f3', 6, 'IUSDC', 'ICON USD Coin'),
};

// disable prettier printWidth rule
// prettier-ignore
export const USDS: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cxbb2871f468a3008f80b08fdde5b8b951583acf06', 18, 'USDS', 'Stably USD'),
  [ChainId.YEOUIDO]: new Token(ChainId.YEOUIDO, 'cxc0666df567a6e0b49342648e98ccbe5362b264ea', 18, 'USDS', 'Stably USD'),
  [ChainId.SEJONG]: new Token(ChainId.SEJONG, 'cxc0dbb2eb24719f8355a7ec3c1aaa93826669ab8e', 18, 'USDS', 'Stably USD'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'cx91a9327ca44e78983e143b1cfb18e8024a1f31d9', 18, 'USDS', 'Stably USD'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'cx313388571690e0f77546cf3885d37da1d40ff207', 18, 'USDS', 'Stably USD'),
};

// disable prettier printWidth rule
// prettier-ignore
export const FIN: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx785d504f44b5d2c8dac04c5a1ecd75f18ee57d16', 18, 'FIN', 'Fin Token'),
};

export const OMM: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx1a29259a59f463a67bb2ef84398b30ca56b5830a', 18, 'OMM', 'Omm Token'),
};

// disable prettier printWidth rule
// prettier-ignore
export const IUSDT: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx3a36ea1f6b9aa3d2dd9cb68e8987bcc3aabaaa88', 6, 'IUSDT', 'ICON Tether'),
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
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx6139a27c15f1653471ffba0b4b88dc15de7e3267', 18, 'BET', 'GangstaBet Token'),
};

// disable prettier printWidth rule
// prettier-ignore
export const ETH: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx288d13e1b63563459a2ac6179f237711f6851cb5', 18, 'ETH', 'Binance Ethereum'),
  [ChainId.LISBON]: new Token(ChainId.MAINNET, 'cx99c79fd6dee53335f686c7f2cb513745622634f2', 18, 'TETH', 'Binance Ethereum'),
};

// disable prettier printWidth rule
// prettier-ignore
export const BTCB: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cx5b5a03cb525a1845d0af3a872d525b18a810acb0', 18, 'BTCB', 'Binance Bitcoin'),
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

export const HIGH_PRICE_ASSET_DP: { [key in string]: number } = {
  cx5b5a03cb525a1845d0af3a872d525b18a810acb0: 6,
  cx99c79fd6dee53335f686c7f2cb513745622634f2: 5,
  cx288d13e1b63563459a2ac6179f237711f6851cb5: 5,
};
