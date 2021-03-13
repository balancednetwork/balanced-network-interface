import { NetworkId } from './addresses';
// import { Contract } from './contracts/contract';
import Baln from './contracts/Baln';
import Loans from './contracts/Loans';
import sICX from './contracts/sICX';
import ContractSettings from './contractSettings';

export class BalancedJs {
  contractSettings: ContractSettings;
  networkId: NetworkId;

  // contracts
  Baln: Baln;
  Loans: Loans;
  sICX: sICX;
  /**
   * Creates instances of balanced contracts based on ContractSettings.
   * Usage example:
   * import {BalancedJs} = require('BalancedJs');
   * const bnjs = new BalancedJs(); //uses default ContractSettings - use mainnet
   * const totalSupply = await bnjs.Synthetix.totalSupply();
   * @constructor
   * @param contractSettings {Partial<ContractSettings>}
   */

  constructor(contractSettings?: Partial<ContractSettings>) {
    let _contractSettings = new ContractSettings(contractSettings);
    this.contractSettings = _contractSettings;
    const { networkId } = _contractSettings;
    this.networkId = networkId;

    // Object.keys(contracts).forEach(name => {
    //   const Contract = contracts[name];
    //   this[name] = new Contract(_contractSettings);
    // });

    this.Baln = new Baln(_contractSettings);
    this.Loans = new Loans(_contractSettings);
    this.sICX = new sICX(_contractSettings);

    console.info(this);
  }
}
