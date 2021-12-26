import { SUPPORTED_TOKENS_LIST } from '../constants/tokens';
import { Token } from './balanced-sdk-core/entities';
import { CurrencyKey } from './index';

export const getTokenFromCurrencyKey = (key?: CurrencyKey) => {
  if (key) return SUPPORTED_TOKENS_LIST.find((token: Token) => token.symbol === key);
};
