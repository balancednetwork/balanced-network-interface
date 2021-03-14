import { IconBuilder } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Dex extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].dex;
  }

  getPrice(params) {
    const p = new IconBuilder.CallBuilder() //
      .to(this.address)
      .method('getPrice')
      .params(params)
      .build();

    return this.provider.call(p).execute();
  }
}
