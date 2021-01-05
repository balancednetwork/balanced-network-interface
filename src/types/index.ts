import { RootState } from './RootState';

export type { RootState };

export declare class Currency {
  readonly decimals: number;
  readonly symbol?: string;
  readonly name?: string;

  /**
   * Constructs an instance of the base class `Currency`. The only instance of the base class `Currency` is `Currency.ETHER`.
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(decimals: number, symbol?: string, name?: string);
}
