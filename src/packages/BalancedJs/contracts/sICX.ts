import BigNumber from 'bignumber.js';
import { IconAmount, IconConverter } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class sICX extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].sicx;
  }

  depositAndBorrow(value: BigNumber) {
    const data = { _asset: '', _amount: 0 };
    return this.transfer(addresses[this.nid].loans, value, JSON.stringify(data));
  }

  deposit(value: BigNumber) {
    return this.transfer(addresses[this.nid].dex, value, JSON.stringify({ method: '_deposit' }));
  }

  swapBybnUSD(value: BigNumber, minimumReceive: BigNumber) {
    const data = {
      method: '_swap',
      params: { toToken: addresses[this.nid].bnusd, minimumReceive: minimumReceive.toString() },
    };

    return this.transfer(
      addresses[this.nid].dex,
      IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop(),
      JSON.stringify(data),
    );
  }

  swapToICX(value: BigNumber) {
    const data = { method: '_swap_icx' };

    return this.transfer(
      addresses[this.nid].dex,
      IconAmount.of(value.toNumber(), IconAmount.Unit.ICX).toLoop(),
      JSON.stringify(data),
    );
  }

  balanceOf(owner: string) {
    const callParams = this.paramsBuilder({
      method: 'balanceOf',
      params: {
        _owner: owner,
      },
    });

    return this.call(callParams);
  }

  transfer(to: string, value: BigNumber, data?: string) {
    const callParams = this.transactionParamsBuilder({
      method: 'transfer',
      params: {
        _to: to,
        _value: IconConverter.toHex(value),
        _data: data && IconConverter.toHex(data),
      },
    });

    if (this.contractSettings.ledgerSettings.actived) {
      return this.callLedger(callParams.params);
    }

    return this.callIconex(callParams);
  }

  unstake(value: BigNumber) {
    return this.transfer(
      addresses[this.nid].staking,
      IconConverter.toHex(value),
      JSON.stringify({ method: 'unstake' }),
    );
  }
}
