import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dex extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dex;
  }

  getPrice(id: number) {
    const callParams = this.paramsBuilder({
      method: 'getPrice',
      params: {
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  getQuotePriceInBase(id: number) {
    const callParams = this.paramsBuilder({
      method: 'getQuotePriceInBase',
      params: {
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  add(baseToken: string, quoteToken: string, baseValue: string, quoteValue: string) {
    const payload = this.transactionParamsBuilder({
      method: 'add',
      params: {
        _baseToken: baseToken,
        _quoteToken: quoteToken,
        _baseValue: IconConverter.toHexNumber(baseValue),
        _quoteValue: IconConverter.toHexNumber(quoteValue),
      },
    });

    return this.callICONPlugins(payload);
  }

  balanceOf(owner: string, id: number, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      blockHeight: blockHeight,
      params: {
        _owner: owner,
        _id: IconConverter.toHex(id),
      },
    });
    return this.call(callParams);
  }

  totalSupply(id: number) {
    const callParams = this.paramsBuilder({
      method: 'totalSupply',
      params: {
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  getNonce() {
    const callParams = this.paramsBuilder({
      method: 'getNonce',
      params: {},
    });

    return this.call(callParams);
  }

  getPoolId(tokenAAddress: string, tokenBAddress: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolId',
      params: {
        _token1Address: tokenAAddress,
        _token2Address: tokenBAddress,
      },
    });

    return this.call(callParams);
  }

  getPoolTotal(id: number, token: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolTotal',
      params: {
        _id: IconConverter.toHex(id),
        _token: token,
      },
    });

    return this.call(callParams);
  }

  getPoolStats(id: number, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getPoolStats',
      blockHeight: blockHeight,
      params: {
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  getDeposit(tokenAddress: string, user: string) {
    const callParams = this.paramsBuilder({
      method: 'getDeposit',
      params: {
        _tokenAddress: tokenAddress,
        _user: user,
      },
    });

    return this.call(callParams);
  }

  transferICX(value: string) {
    const payload = this.transferICXParamsBuilder({
      value: IconConverter.toHexNumber(value),
    });

    return this.callICONPlugins(payload);
  }

  transfer(to: string, poolId: number, value: string, data?: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _id: IconConverter.toHex(poolId),
        _value: IconConverter.toHexNumber(value),
        _data: data && IconConverter.toHex(data),
      },
    });

    return this.callICONPlugins(callParams);
  }

  stake(poolId: number, value: string) {
    return this.transfer(addresses[this.nid].stakedLp, poolId, value, JSON.stringify({ method: '_stake' }));
  }

  getICXWithdrawLock() {
    const callParams = this.paramsBuilder({
      method: 'getICXWithdrawLock',
    });

    return this.call(callParams);
  }

  cancelSicxIcxOrder() {
    const payload = this.transactionParamsBuilder({
      method: 'cancelSicxicxOrder',
    });

    return this.callICONPlugins(payload);
  }

  // This method can withdraw up to a user's holdings in a pool, but it cannot
  // be called if the user has not passed their withdrawal lock time period.
  remove(id: number, value: string, withdraw: number = 1) {
    const payload = this.transactionParamsBuilder({
      method: 'remove',
      params: {
        _id: IconConverter.toHex(id),
        _value: IconConverter.toHexNumber(value),
        _withdraw: IconConverter.toHex(withdraw),
      },
    });

    return this.callICONPlugins(payload);
  }

  getFees() {
    const callParams = this.paramsBuilder({
      method: 'getFees',
    });

    return this.call(callParams);
  }

  isEarningRewards(address: string, id: number) {
    const callParams = this.paramsBuilder({
      method: 'isEarningRewards',
      params: {
        _address: address,
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }

  withdraw(token: string, value: string) {
    const payload = this.transactionParamsBuilder({
      method: 'withdraw',
      params: {
        _token: token,
        _value: IconConverter.toHexNumber(value),
      },
    });

    return this.callICONPlugins(payload);
  }

  getICXBalance(address: string) {
    const callParams = this.paramsBuilder({
      method: 'getICXBalance',
      params: {
        _address: address,
      },
    });

    return this.call(callParams);
  }

  getSicxEarnings(user: string) {
    const callParams = this.paramsBuilder({
      method: 'getSicxEarnings',
      params: {
        _user: user,
      },
    });

    return this.call(callParams);
  }

  withdrawSicxEarnings() {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawSicxEarnings',
    });

    return this.callICONPlugins(payload);
  }

  /**
   * Not used, and not on chain
   */
  getPoolStatsForPair(base: string, quote: string) {
    const callParams = this.paramsBuilder({
      method: 'getPoolStatsForPair',
      params: {
        _base: base,
        _quote: quote,
      },
    });

    return this.call(callParams);
  }

  totalDexAddresses(id: number) {
    const callParams = this.paramsBuilder({
      method: 'totalDexAddresses',
      params: {
        _id: IconConverter.toHex(id),
      },
    });

    return this.call(callParams);
  }
}
