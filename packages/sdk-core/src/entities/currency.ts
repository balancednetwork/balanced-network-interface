import { NativeCurrency } from './nativeCurrency';
import { Token } from './token';
import { ExternalNativeToken } from './externalNativeToken';

export type Currency = NativeCurrency | Token | ExternalNativeToken;
