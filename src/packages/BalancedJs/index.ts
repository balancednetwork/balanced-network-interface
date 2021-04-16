import BigNumber from 'bignumber.js';

import { NetworkId } from './addresses';
import BALN from './contracts/BALN';
import Band from './contracts/Band';
import bnUSD from './contracts/bnUSD';
import { Contract } from './contracts/contract';
import Dex from './contracts/Dex';
import ICX from './contracts/ICX';
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

const LOOP = new BigNumber('1000000000000000000');

export class BalancedJs {
  contractSettings: ContractSettings;
  networkId: NetworkId;
  provider: any;

  // contracts
  BALN: BALN;
  sICX: sICX;
  bnUSD: bnUSD;
  ICX: ICX;
  Loans: Loans;
  Band: Band;
  Staking: Staking;
  Dex: Dex;
  Rewards: Rewards;

  static utils = {
    toLoop(value: BigNumber | number | string): BigNumber {
      return new BigNumber(value).times(LOOP).integerValue(BigNumber.ROUND_DOWN);
    },
    toIcx(value: BigNumber | number | string): BigNumber {
      return new BigNumber(value).div(LOOP);
    },
    POOL_IDS: {
      BALNbnUSD: 3,
      sICXbnUSD: 2,
      sICXICX: 1,
    },
  };

  /**
   * Creates instances of balanced contracts based on ContractSettings.
   * Usage example:
   * import {BalancedJs} = require('BalancedJs');
   * const bnjs = new BalancedJs(); //uses default ContractSettings - use mainnet
   * @constructor
   * @param contractSettings {Partial<ContractSettings>}
   */

  constructor(contractSettings?: Partial<ContractSettings>) {
    this.contractSettings = new ContractSettings(contractSettings);
    this.networkId = this.contractSettings.networkId;
    this.provider = this.contractSettings.provider;

    // Object.keys(contracts).forEach(name => {
    //   const Contract = contracts[name];
    //   this[name] = new Contract(_contractSettings);
    // });

    // token
    this.BALN = new BALN(this.contractSettings);
    this.ICX = new ICX(this.contractSettings);
    this.bnUSD = new bnUSD(this.contractSettings);
    this.sICX = new sICX(this.contractSettings);

    this.Loans = new Loans(this.contractSettings);
    this.Band = new Band(this.contractSettings);
    this.Staking = new Staking(this.contractSettings);
    this.Dex = new Dex(this.contractSettings);
    this.Rewards = new Rewards(this.contractSettings);
  }

  eject({ account }: SettingEjection) {
    this.contractSettings.account = account;
    return this;
  }

  transfer(to: string, value: BigNumber): Promise<any> {
    const contract = new Contract(this.contractSettings);
    contract.address = to;
    const payload = contract.transferICXParamsBuilder({
      value,
    });
    return contract.callIconex(payload);
  }
}
