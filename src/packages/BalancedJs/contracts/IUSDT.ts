import addresses from '../addresses';
import ContractSettings from '../contractSettings';
import IRC2 from './IRC2';

export default class IUSDT extends IRC2 {
  constructor(contractSettings: ContractSettings) {
    super(contractSettings);
    this.address = addresses[this.nid].iusdt;
  }
}
