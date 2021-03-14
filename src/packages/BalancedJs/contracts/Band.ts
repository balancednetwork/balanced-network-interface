import { IconBuilder } from 'icon-sdk-js';

import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import { Contract } from './contract';

export default class Band extends Contract {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].band;
  }

  getReferenceData(params) {
    const p = new IconBuilder.CallBuilder() //
      .to(this.address)
      .method('get_reference_data')
      .params(params)
      .build();

    return this.provider.call(p).execute();
  }
}
