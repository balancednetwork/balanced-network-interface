import { NetworkId } from './addresses';
// import { Contract } from './contracts/contract';
import Baln from './contracts/Baln';
import Band from './contracts/Band';
import bnUSD from './contracts/bnUSD';
import Dex from './contracts/Dex';
import Loans from './contracts/Loans';
import sICX from './contracts/sICX';
import Staking from './contracts/Staking';
import ContractSettings from './contractSettings';

export class BalancedJs {
  contractSettings: ContractSettings;
  networkId: NetworkId;

  // contracts
  Baln: Baln;
  Loans: Loans;
  sICX: sICX;
  Band: Band;
  Staking: Staking;
  Dex: Dex;
  bnUSD: bnUSD;

  // static
  static utils = {
    BALNbnUSDpoolId: 3,
    sICXbnUSDpoolId: 2,
    sICXICXpoolId: 1,
  };
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
    this.Band = new Band(_contractSettings);
    this.Staking = new Staking(_contractSettings);
    this.Dex = new Dex(_contractSettings);
    this.bnUSD = new bnUSD(_contractSettings);

    console.info(this);
  }
}
