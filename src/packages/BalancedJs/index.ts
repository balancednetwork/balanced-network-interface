import { NetworkId } from './addresses';
// import { Contract } from './contracts/contract';
import Baln from './contracts/Baln';
import Band from './contracts/Band';
import bnUSD from './contracts/bnUSD';
import Dex from './contracts/Dex';
import Loans from './contracts/Loans';
import Rewards from './contracts/Rewards';
import sICX from './contracts/sICX';
import Staking from './contracts/Staking';
import ContractSettings from './contractSettings';

export type AccountType = string | undefined | null;
export type ResponseJsonRPCPayload = {
  id: number;
  jsonrpc: string;
  result: string;
};

export type SettingEjection = {
  account: AccountType;
};

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
  Rewards: Rewards;

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
    this.contractSettings = new ContractSettings(contractSettings);
    this.networkId = this.contractSettings.networkId;

    // Object.keys(contracts).forEach(name => {
    //   const Contract = contracts[name];
    //   this[name] = new Contract(_contractSettings);
    // });

    this.Baln = new Baln(this.contractSettings);
    this.Loans = new Loans(this.contractSettings);
    this.sICX = new sICX(this.contractSettings);
    this.Band = new Band(this.contractSettings);
    this.Staking = new Staking(this.contractSettings);
    this.Dex = new Dex(this.contractSettings);
    this.bnUSD = new bnUSD(this.contractSettings);
    this.Rewards = new Rewards(this.contractSettings);
  }

  eject({ account }: SettingEjection) {
    this.contractSettings.account = account;
    return this;
  }
}
