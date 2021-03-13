import { nid } from '.';
import addresses from '../../constants/addresses';
import { IconWrapper } from './iconWrapper';

export class DummyOracle extends IconWrapper {
  constructor(public account: string) {
    super(nid);
    this.address = addresses[this.nid].dummy_oracle;
  }

  getReferenceData() {
    const callParams = this.paramsBuilder({
      method: 'get_reference_data',
      params: { _base: 'ICX', _quote: 'USD' },
    });

    return this.call(callParams);
  }
}
