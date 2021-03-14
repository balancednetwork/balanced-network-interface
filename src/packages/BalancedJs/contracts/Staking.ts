import { IconBuilder } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Staking extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].staking;
  }

  getTodayRate() {
    const p = new IconBuilder.CallBuilder() //
      .to(this.address)
      .method('getTodayRate')
      .build();

    return this.provider.call(p).execute();
  }
}
