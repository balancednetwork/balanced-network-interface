import { nid, AccountType } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class DummyOracle extends IconWrapper {
  constructor(public account: AccountType) {
    super(nid);
    this.address = addresses[this.nid].dummy_oracle;
  }

  getReferenceData(params: { _base: string; _quote: string }) {
    const callParams = this.paramsBuilder({
      method: 'get_reference_data',
      params,
    });

    return this.call(callParams);
  }
}
