import { Converter as IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Loans extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].loans;
  }

  withdrawCollateral(value: string, collateralType?: string) {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawCollateral',
      params: { 
        _value: IconConverter.toHexNumber(value),
        _collateralSymbol: collateralType || null,
      },
    });

    return this.callICONPlugins(payload);
  }

  withdrawAndUnstake(value: string) {
    const payload = this.transactionParamsBuilder({
      method: 'withdrawAndUnstake',
      params: { 
        _value: IconConverter.toHexNumber(value),
      },
    });

    return this.callICONPlugins(payload);
  }

  depositAndBorrow(value: string, params: { asset?: 'bnUSD'; amount?: string; from?: string; value?: string } = {}) {
    const payload = this.transactionParamsBuilder({
      method: 'depositAndBorrow',
      value: IconConverter.toHexNumber(value),
      params: {
        _asset: params.asset,
        _amount: params.amount && IconConverter.toHexNumber(params.amount),
        _from: params.from,
        _value: params.value && IconConverter.toHexNumber(params.value),
      },
    });

    return this.callICONPlugins(payload);
  }

  borrow(amount: string, collateralType?: string, asset?: string) {
    const payload = this.transactionParamsBuilder({
      method: 'borrow',
      params: {
        _collateralToBorrowAgainst: collateralType || 'sICX',
        _assetToBorrow: asset || 'bnUSD',
        _amountToBorrow: IconConverter.toHexNumber(amount),
      },
    })

    return this.callICONPlugins(payload);
  }

  returnAsset(symbol: string, value: string, collateralType?: string) {
    const payload = this.transactionParamsBuilder({
      method: 'returnAsset',
      params: {
        _symbol: symbol,
        _value: IconConverter.toHexNumber(value),
        _collateralSymbol: collateralType || 'sICX',
      },
    });

    return this.callICONPlugins(payload);
  }

  getAvailableAssets() {
    const callParams = this.paramsBuilder({
      method: 'getAvailableAssets',
    });

    return this.call(callParams);
  }

  getAccountPositions(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'getAccountPositions',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  getParameters() {
    const callParams = this.paramsBuilder({
      method: 'getParameters',
    });

    return this.call(callParams);
  }

  getNonzeroPositionCount() {
    const callParams = this.paramsBuilder({
      method: 'getNonzeroPositionCount',
    });

    return this.call(callParams);
  }

  getCollateralTokens() {
    const callParams = this.paramsBuilder({
      method: 'getCollateralTokens',
    });

    return this.call(callParams);
  }

  getDebtCeiling(symbol: string) {
    const callParams = this.paramsBuilder({
      method: 'getDebtCeiling',
      params: {
        symbol: symbol,
      },
    });

    return this.call(callParams);
  }

  getLiquidationRatio(symbol: string) {
    const callParams = this.paramsBuilder({
      method: 'getLiquidationRatio',
      params: {
        _symbol: symbol,
      },
    });

    return this.call(callParams);
  }

  getLockingRatio(symbol: string) {
    const callParams = this.paramsBuilder({
      method: 'getLockingRatio',
      params: {
        _symbol: symbol,
      },
    });

    return this.call(callParams);
  }

  getTotalCollateralDebt(collateral: string, asset: string, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getTotalCollateralDebt',
      blockHeight: blockHeight,
      params: {
        collateral: collateral,
        assetSymbol: asset,
      },
    });

    return this.call(callParams);
  }

  borrowerCount() {
    const callParams = this.paramsBuilder({
      method: 'borrowerCount',
    });

    return this.call(callParams);
  }

  getBorrowerCount(collateralAddress: string, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'borrowerCount',
      blockHeight,
      params: {
        collateralAddress
      }
    });

    return this.call(callParams);
  }

  getCurrentFloor(tokenAddress: string, blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getCurrentFloor',
      blockHeight,
      params: {
        tokenAddress
      }
    });

    return this.call(callParams);
  }

  getFloorPercentage(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getFloorPercentage',
      blockHeight
    });

    return this.call(callParams);
  }

  getTimeDelayMicroSeconds(blockHeight?: number) {
    const callParams = this.paramsBuilder({
      method: 'getTimeDelayMicroSeconds',
      blockHeight
    });

    return this.call(callParams);
  }
  
  getInterestRate(symbol: string) {
    const callParams = this.paramsBuilder({
      method: 'getInterestRate',
      params: {
        symbol,
      },
    })

    return this.call(callParams);
  }
}
