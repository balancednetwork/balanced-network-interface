import BigNumber from 'bignumber.js';
import { Converter as IconConverter } from 'icon-sdk-js';
import { isEmpty } from 'lodash-es';

import { SupportedChainId as NetworkId, SupportedChainId, ALL_SUPPORTED_CHAIN_IDS, CHAIN_INFO } from './chain';
import Airdrip from './contracts/Airdrip';
import BALN from './contracts/BALN';
import Band from './contracts/Band';
import bnUSD from './contracts/bnUSD';
import { Contract } from './contracts/contract';
import DAOFund from './contracts/DAOFund';
import Dex from './contracts/Dex';
import Dividends from './contracts/Dividends';
import Governance from './contracts/Governance';
import ICX from './contracts/ICX';
import IRC2 from './contracts/IRC2';
import LiquidationDisbursement from './contracts/LiquidationDisbursement';
import Loans from './contracts/Loans';
import Multicall, { CallData } from './contracts/Multicall';
import Rebalancing from './contracts/Rebalancing';
import Rewards from './contracts/Rewards';
import Router from './contracts/Router';
import sICX from './contracts/sICX';
import Staking from './contracts/Staking';
import IISS from './contracts/IISS';
import StabilityFund from './contracts/StabilityFund';
import ContractSettings, { LedgerSettings, AccountType } from './contractSettings';
import StakedLP from './contracts/StakedLP';
import BalancedOracle from './contracts/BalancedOracle';
import BBALN from './contracts/BBALN';
import FeeHandler from './contracts/FeeHandler';
import Bribe from './contracts/Bribe';
import XCall from './contracts/XCall';
import AssetManager from './contracts/AssetManager';
import Savings from './contracts/Savings';
import Trickler from './contracts/Trickler';
import NOL from './contracts/NOL';
import ICXBurner from './contracts/ICXBurner';

export * from './contractSettings';
export { default as addresses } from './addresses';

export { CallData };

export { SupportedChainId, ALL_SUPPORTED_CHAIN_IDS, CHAIN_INFO };

export type ResponseJsonRPCPayload = {
  id: number;
  jsonrpc: string;
  result: string;
};

export type SettingInjection = {
  account?: AccountType;
  legerSettings?: LedgerSettings;
};

export const LOOP = new BigNumber('1000000000000000000');
const TEN = new BigNumber('10');
export class BalancedJs {
  contractSettings: ContractSettings;
  networkId: NetworkId;
  provider: any;

  // token contracts
  BALN: BALN;
  sICX: sICX;
  ICX: ICX;
  bnUSD: bnUSD;
  //
  Loans: Loans;
  Router: Router;
  Band: Band;
  Staking: Staking;
  Dex: Dex;
  Rewards: Rewards;
  Airdrip: Airdrip;
  Dividends: Dividends;
  Governance: Governance;
  Rebalancing: Rebalancing;
  DAOFund: DAOFund;
  Multicall: Multicall;
  LiquidationDisbursement: LiquidationDisbursement;
  IISS: IISS;
  StabilityFund: StabilityFund;
  StakedLP: StakedLP;
  BalancedOracle: BalancedOracle;
  BBALN: BBALN;
  FeeHandler: FeeHandler;
  Bribe: Bribe;
  XCall: XCall;
  AssetManager: AssetManager;
  Savings: Savings;
  Trickler: Trickler;
  NOL: NOL;
  ICXBurner: ICXBurner;

  static utils = {
    toLoop(value: BigNumber | number | string, currencyKey?: string): BigNumber {
      if (currencyKey === 'IUSDC' || currencyKey === 'IUSDT')
        return new BigNumber(value).times(new BigNumber(10).pow(6)).integerValue(BigNumber.ROUND_DOWN);
      else return new BigNumber(value).times(LOOP).integerValue(BigNumber.ROUND_DOWN);
    },
    toIcx(value: BigNumber | number | string, currencyKey?: string): BigNumber {
      if (currencyKey === 'IUSDC' || currencyKey === 'IUSDT') return new BigNumber(value).div(new BigNumber(10).pow(6));
      else return new BigNumber(value).div(LOOP);
    },
    toFormat(value: BigNumber | number | string, decimals: number = 18) {
      return new BigNumber(value).div(TEN.pow(decimals));
    },
    POOL_IDS: {
      BALNsICX: 4,
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
    this.sICX = new sICX(this.contractSettings);
    this.bnUSD = new bnUSD(this.contractSettings);

    this.Loans = new Loans(this.contractSettings);
    this.Router = new Router(this.contractSettings);
    this.Band = new Band(this.contractSettings);
    this.Staking = new Staking(this.contractSettings);
    this.Dex = new Dex(this.contractSettings);
    this.Rewards = new Rewards(this.contractSettings);
    this.Airdrip = new Airdrip(this.contractSettings);
    this.Dividends = new Dividends(this.contractSettings);
    this.Governance = new Governance(this.contractSettings);
    this.Rebalancing = new Rebalancing(this.contractSettings);
    this.DAOFund = new DAOFund(this.contractSettings);
    this.Multicall = new Multicall(this.contractSettings);
    this.LiquidationDisbursement = new LiquidationDisbursement(this.contractSettings);
    this.IISS = new IISS(this.contractSettings);
    this.StabilityFund = new StabilityFund(this.contractSettings);
    this.StakedLP = new StakedLP(this.contractSettings);
    this.BalancedOracle = new BalancedOracle(this.contractSettings);
    this.BBALN = new BBALN(this.contractSettings);
    this.FeeHandler = new FeeHandler(this.contractSettings);
    this.Bribe = new Bribe(this.contractSettings);
    this.XCall = new XCall(this.contractSettings);
    this.AssetManager = new AssetManager(this.contractSettings);
    this.Savings = new Savings(this.contractSettings);
    this.Trickler = new Trickler(this.contractSettings);
    this.NOL = new NOL(this.contractSettings);
    this.ICXBurner = new ICXBurner(this.contractSettings);
  }

  inject({ account, legerSettings }: SettingInjection) {
    this.contractSettings.account = account || this.contractSettings.account;
    this.contractSettings.ledgerSettings.transport =
      legerSettings?.transport || this.contractSettings.ledgerSettings.transport;
    this.contractSettings.ledgerSettings.actived = !isEmpty(this.contractSettings.ledgerSettings.transport);
    this.contractSettings.ledgerSettings.path = legerSettings?.path || this.contractSettings.ledgerSettings.path;
    return this;
  }

  transfer(to: string, value: string): Promise<any> {
    const contract = new Contract(this.contractSettings);
    contract.address = to;
    const payload = contract.transferICXParamsBuilder({
      value: IconConverter.toHexNumber(value),
    });

    return contract.callICONPlugins(payload);
  }

  getContract(address: string): IRC2 {
    return new IRC2(this.contractSettings, address);
  }

  resetContractLedgerSettings() {
    this.contractSettings.resetLedgerSettings();
  }
}
