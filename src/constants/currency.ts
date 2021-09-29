import keyBy from 'lodash/keyBy';
import { SupportedChainId as NetworkId } from 'packages/BalancedJs';

import { ReactComponent as BALNIcon } from 'assets/tokens/BALN.svg';
import { ReactComponent as bnUSDIcon } from 'assets/tokens/bnUSD.svg';
import { ReactComponent as ICXIcon } from 'assets/tokens/ICX.svg';
import { ReactComponent as IUSDCIcon } from 'assets/tokens/IUSDC.svg';
import { ReactComponent as OMMIcon } from 'assets/tokens/OMM.svg';
import { ReactComponent as sICXIcon } from 'assets/tokens/sICX.svg';
import { ReactComponent as USDSIcon } from 'assets/tokens/USDS.svg';
import { CurrencyKey, Pool } from 'types';

import { PairInfo, SUPPORTED_PAIRS } from './pairs';

export const CURRENCY_INFO: { [networkId: number]: CurrencyKey[] } = {
  [NetworkId.MAINNET]: ['ICX', 'sICX', 'bnUSD', 'BALN', 'IUSDC', 'OMM', 'USDS'],
  [NetworkId.YEOUIDO]: ['ICX', 'sICX', 'bnUSD', 'BALN', 'OMM', 'IUSDC', 'USDS'],
};

const NETWORK_ID: NetworkId = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export const CURRENCY: CurrencyKey[] = CURRENCY_INFO[NETWORK_ID];

export const CURRENCY_MAP = keyBy(CURRENCY);

export const currencyKeyToIconMap = {
  ICX: ICXIcon,
  sICX: sICXIcon,
  bnUSD: bnUSDIcon,
  BALN: BALNIcon,
  OMM: OMMIcon,
  IUSDC: IUSDCIcon,
  USDS: USDSIcon,
};

export const getPairableCurrencies = (currencyKey: CurrencyKey | undefined): CurrencyKey[] => {
  if (!currencyKey) return CURRENCY;

  const leftPairableCurrencies = SUPPORTED_PAIRS.filter(pair => pair.quoteCurrencyKey === currencyKey).map(
    pair => pair.baseCurrencyKey,
  );

  const rightPairableCurrencies = SUPPORTED_PAIRS.filter(pair => pair.baseCurrencyKey === currencyKey).map(
    pair => pair.quoteCurrencyKey,
  );

  return [...leftPairableCurrencies, ...rightPairableCurrencies];
};

export const getTradePair = (
  baseKey?: CurrencyKey,
  quoteKey?: CurrencyKey,
): [PairInfo | undefined, boolean | undefined] => {
  if (baseKey && quoteKey) {
    const pair1 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === baseKey && pair.quoteCurrencyKey === quoteKey);
    const pair2 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === quoteKey && pair.quoteCurrencyKey === baseKey);

    if (pair1) {
      return [pair1, false];
    } else if (pair2) {
      return [pair2, true];
    }
  }
  return [undefined, undefined];
};

export const isQueue = (t: Pool | PairInfo) => {
  if (
    (t.baseCurrencyKey === 'sICX' && t.quoteCurrencyKey === 'ICX') ||
    (t.baseCurrencyKey === 'ICX' && t.quoteCurrencyKey === 'sICX')
  )
    return true;
  return false;
};

export const addressToCurrencyKeyMap = {
  [NetworkId.MAINNET]: {
    cx2609b924e33ef00b648a409245c7ea394c467824: 'sICX',
    cx88fd7df7ddff82f7cc735c871dc519838cb235bb: 'bnUSD',
    cxf61cd5a45dc9f91c15aa65831a30a90d59a09619: 'BALN',
    cx0000000000000000000000000000000000000000: 'ICX',
    cxae3034235540b924dfcc1b45836c293dcc82bfb7: 'IUSDC',
    cxbb2871f468a3008f80b08fdde5b8b951583acf06: 'USDS',
    cx1a29259a59f463a67bb2ef84398b30ca56b5830a: 'OMM',
  },
  [NetworkId.YEOUIDO]: {
    cxae6334850f13dfd8b50f8544d5acb126bb8ef82d: 'sICX',
    cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a: 'bnUSD',
    cx36169736b39f59bf19e8950f6c8fa4bfa18b710a: 'BALN',
    cx0000000000000000000000000000000000000000: 'ICX',
    cx65f639254090820361da483df233f6d0e69af9b7: 'IUSDC',
    cxc0666df567a6e0b49342648e98ccbe5362b264ea: 'USDS',
    cxc58f32a437c8e5a5fcb8129626662f2252ad2678: 'OMM',
  },
};
