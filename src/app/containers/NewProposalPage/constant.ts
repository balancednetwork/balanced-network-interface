import { BalancedJs } from '@balancednetwork/balanced-js';
import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { defineMessage } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import bnJs from 'bnJs';
import { FUNDING_TOKENS_LIST } from 'constants/tokens';
import { parseUnits } from 'utils';

import { ORACLE_TYPE, CollateralProposal } from '.';
import { CurrencyValue } from '../../components/newproposal/FundingInput';

export const MAX_RATIO_VALUE = 100;

export const PROPOSAL_MAPPING = {
  // network fee allocation
  daofund: 'DAO fund',
  baln_holders: 'BALN holders',
  // baln allocation
  DAOfund: 'DAO fund',
  'Reserve Fund': 'Reserve',
  'Worker Tokens': 'Workers',
  Loans: 'Borrowers',
  'sICX/ICX': 'sICX / ICX',
  'sICX/bnUSD': 'sICX / bnUSD',
  'BALN/bnUSD': 'BALN / bnUSD',
  'BALN/sICX': 'BALN / sICX',
  'IUSDC/bnUSD': 'IUSDC / bnUSD',
  'IUSDT/bnUSD': 'IUSDT / bnUSD',
  'USDS/bnUSD': 'USDS / bnUSD',
};

export enum PROPOSAL_TYPE {
  TEXT = 'Text',
  NEW_COLLATERAL_TYPE = 'New collateral type',
  BALN_ALLOCATION = 'BALN allocation',
  NETWORK_FEE_ALLOCATION = 'Network fee allocation',
  LOAN_FEE = 'Loan fee',
  LOAN_TO_VALUE_RATIO = 'Loan to value ratio',
  REBALANCING_THRESHOLD = 'Rebalancing threshold',
  FUNDING = 'Funding',
}

export const PROPOSAL_TYPE_LABELS = {
  [PROPOSAL_TYPE.TEXT]: defineMessage({ message: 'Text' }),
  [PROPOSAL_TYPE.BALN_ALLOCATION]: defineMessage({ message: 'BALN allocation' }),
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: defineMessage({ message: 'Network fee allocation' }),
  [PROPOSAL_TYPE.LOAN_FEE]: defineMessage({ message: 'Loan fee' }),
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: defineMessage({ message: 'Loan to value ratio' }),
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: defineMessage({ message: 'Rebalancing threshold' }),
  [PROPOSAL_TYPE.FUNDING]: defineMessage({ message: 'Funding' }),
  [PROPOSAL_TYPE.NEW_COLLATERAL_TYPE]: defineMessage({ message: 'New collateral type' }),
};

export const ACTIONS_MAPPING = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: ['updateBalTokenDistPercentage', 'updateDistPercent'],
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: ['setDividendsCategoryPercentage'],
  [PROPOSAL_TYPE.LOAN_FEE]: ['setOriginationFee', 'update_origination_fee'],
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: ['setLockingRatio', 'update_locking_ratio'],
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: ['setRebalancingThreshold'],
  [PROPOSAL_TYPE.FUNDING]: ['daoDisburse'],
  [PROPOSAL_TYPE.NEW_COLLATERAL_TYPE]: ['addDexPricedCollateral', 'addCollateral'],
};

export const PERCENT_MAPPING = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: percent =>
    Number((Math.round(Number(BalancedJs.utils.toIcx(percent).times(10000))) / 100).toFixed(2)),
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: percent =>
    Number((Math.round(Number(BalancedJs.utils.toIcx(percent).times(10000))) / 100).toFixed(2)),
  [PROPOSAL_TYPE.LOAN_FEE]: percent => Number((percent / 100).toFixed(2)),
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: percent => Number((1000000 / percent).toFixed(2)),
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: percent => Number(BalancedJs.utils.toIcx(percent).times(100).toFixed(2)),
};

export const RATIO_VALUE_FORMATTER = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: data => {
    const t: any[] = [];
    Object.keys(PROPOSAL_MAPPING).forEach(key => {
      const p = data.find(item => item.recipient_name === key);
      if (p) {
        t.push({
          name: p.recipient_name,
          percent: PERCENT_MAPPING[PROPOSAL_TYPE.BALN_ALLOCATION](p.dist_percent),
        });
      }
    });
    return t;
  },
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: data => {
    return data.map((item: { [key: string]: number }) => {
      const _item = Object.entries(item)[0];
      return {
        name: _item[0],
        percent: PERCENT_MAPPING[PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION](_item[1]),
      };
    });
  },
  [PROPOSAL_TYPE.LOAN_FEE]: (data: number) => {
    const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.LOAN_FEE](data);
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: (data: number) => {
    const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO](data);
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: data => {
    const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.REBALANCING_THRESHOLD](data);
    return [{ percent: _percent }];
  },
};

export const PROPOSAL_CONFIG = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: {
    fetchInputData: async () => {
      const res = await bnJs.Rewards.getRecipientsSplit();
      return Object.keys(PROPOSAL_MAPPING)
        .filter(key => res[key])
        .map(key => ({
          name: key,
          percent: PERCENT_MAPPING[PROPOSAL_TYPE.BALN_ALLOCATION](res[key]),
        }));
    },
    submitParams: ratioInputValue => {
      const recipientList = Object.entries(ratioInputValue).map(item => ({
        recipient_name: item[0],
        dist_percent: BalancedJs.utils.toLoop(new BigNumber(item[1] as string).div(100)).toNumber(),
      }));
      return [['updateBalTokenDistPercentage', { _recipient_list: recipientList }]];
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: {
    fetchInputData: async () => {
      const res = await bnJs.Dividends.getDividendsPercentage();
      return Object.entries(res).map(([key, value]) => ({
        name: key,
        percent: PERCENT_MAPPING[PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION](value),
      }));
    },
    submitParams: ratioInputValue => {
      const dist_list = Object.entries(ratioInputValue).map(item => {
        return {
          recipient_name: item[0],
          dist_percent: BalancedJs.utils.toLoop(new BigNumber(item[1] as string).div(100)).toNumber(),
        };
      });
      return [['setDividendsCategoryPercentage', { _dist_list: dist_list }]];
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },
  [PROPOSAL_TYPE.LOAN_FEE]: {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.LOAN_FEE](parseInt(res['origination fee'], 16));
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const origination_fee = Number(Object.values(ratioInputValue)) * 100;
      return [['setOriginationFee', { _fee: origination_fee }]];
    },
    validate: sum => ({
      isValid: sum <= 10,
      message: 'Must be less than or equal to 10%.',
    }),
  },
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO](parseInt(res['locking ratio'], 16));

      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const locking_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return [['setLockingRatio', { _value: locking_ratio }]];
    },
    validate: sum => ({
      isValid: sum < 66.67,
      message: 'Must be less than the liquidation threshold (66.67%).',
    }),
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: {
    fetchInputData: async () => {
      const res = await bnJs.Rebalancing.getPriceChangeThreshold();
      const _percent = PERCENT_MAPPING[PROPOSAL_TYPE.REBALANCING_THRESHOLD](res);
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const rebalance_ratio = BalancedJs.utils
        .toLoop(Number(Object.values(ratioInputValue)))
        .div(100)
        .toNumber();
      return [['setRebalancingThreshold', { _value: rebalance_ratio }]];
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
  [PROPOSAL_TYPE.FUNDING]: {
    fetchInputData: async () => {
      const res = await bnJs.DAOFund.getBalances();
      return FUNDING_TOKENS_LIST.filter(token => res[token.address]).map(token =>
        CurrencyAmount.fromRawAmount(token, res[token.address]),
      );
    },
    submitParams: (currencyValue: CurrencyValue) => {
      const amounts = currencyValue.amounts
        .map(
          (amount, idx) =>
            amount.inputDisplayValue && {
              amount: amount.item.quotient.toString(),
              address: (amount.item.currency as Token).address,
            },
        )
        .filter(value => value);
      return [['daoDisburse', { _recipient: currencyValue.recipient, _amounts: amounts }]];
    },
  },
  [PROPOSAL_TYPE.NEW_COLLATERAL_TYPE]: {
    fetchInputData: () => [],
    validate: () => ({
      isValid: true,
      message: 'TO DO',
    }),
    submitParams: ({
      address,
      oracleType,
      oracleValue,
      debtCeiling,
      borrowLTV,
      liquidationLTV,
    }: CollateralProposal) => {
      const params = {
        _token_address: address,
        _active: false,
        _lockingRatio: Math.round(1000000 / Number(borrowLTV || 1)),
        _liquidationRatio: Math.round(1000000 / Number(liquidationLTV || 1)),
        _debtCeiling: parseUnits(debtCeiling),
      };

      return oracleType === ORACLE_TYPE.BAND
        ? [['addCollateral', { ...params, _peg: oracleValue }]]
        : [['addDexPricedCollateral', params]];
    },
  },
};
