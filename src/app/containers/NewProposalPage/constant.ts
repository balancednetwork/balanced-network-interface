import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';

export const MAX_RATIO_VALUE = 100;

const ProposalMapping = {
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
};

export enum PROPOSAL_TYPE {
  TEXT = 'Text',
  BALN_ALLOCATION = 'BALN allocation',
  NETWORK_FEE_ALLOCATION = 'Network fee allocation',
  LOAN_FEE = 'Loan fee',
  LOAN_TO_VALUE_RATIO = 'Loan to value ratio',
  REBALANCING_THRESHOLD = 'Rebalancing threshold',
}

export const ActionsMapping = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: ['updateBalTokenDistPercentage', 'updateDistPercent'],
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: ['setDividendsCategoryPercentage'],
  [PROPOSAL_TYPE.LOAN_FEE]: ['setOriginationFee', 'update_origination_fee'],
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: ['setLockingRatio', 'update_locking_ratio'],
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: ['setRebalancingThreshold'],
};

export const PercentMapping = {
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
    Object.keys(ProposalMapping).forEach(key => {
      const p = data.find(item => item.recipient_name === key);
      if (p) {
        t.push({
          name: ProposalMapping[p.recipient_name] || p.recipient_name,
          percent: PercentMapping[PROPOSAL_TYPE.BALN_ALLOCATION](p.dist_percent),
        });
      }
    });
    return t;
  },
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: data => {
    return data.map((item: { [key: string]: number }) => {
      const _item = Object.entries(item)[0];
      return {
        name: ProposalMapping[_item[0]] || _item[0],
        percent: PercentMapping[PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION](_item[1]),
      };
    });
  },
  [PROPOSAL_TYPE.LOAN_FEE]: (data: number) => {
    const _percent = PercentMapping[PROPOSAL_TYPE.LOAN_FEE](data);
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: (data: number) => {
    const _percent = PercentMapping[PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO](data);
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: data => {
    const _percent = PercentMapping[PROPOSAL_TYPE.REBALANCING_THRESHOLD](data);
    return [{ percent: _percent }];
  },
};

const getKeyByValue = value => {
  return Object.keys(ProposalMapping).find(key => ProposalMapping[key] === value);
};

export const PROPOSAL_CONFIG = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: {
    fetchInputData: async () => {
      const res = await bnJs.Rewards.getRecipientsSplit();
      return Object.keys(ProposalMapping)
        .filter(key => res[key])
        .map(key => ({
          name: ProposalMapping[key] || key,
          percent: PercentMapping[PROPOSAL_TYPE.BALN_ALLOCATION](res[key]),
        }));
    },
    submitParams: ratioInputValue => {
      const recipientList = Object.entries(ratioInputValue).map(item => ({
        recipient_name: getKeyByValue(item[0]) || item[0],
        dist_percent: BalancedJs.utils.toLoop(new BigNumber(item[1] as string).div(100)).toNumber(),
      }));
      return {
        updateBalTokenDistPercentage: { _recipient_list: recipientList },
      };
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: {
    fetchInputData: async () => {
      const res = await bnJs.Dividends.getDividendsPercentage();
      return Object.entries(res).map(([key, value]) => ({
        name: ProposalMapping[key] || key,
        percent: PercentMapping[PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION](value),
      }));
    },
    submitParams: ratioInputValue => {
      const dist_list = Object.entries(ratioInputValue).map(item => {
        const key = getKeyByValue(item[0]);
        return (
          key && {
            [key]: BalancedJs.utils.toLoop(new BigNumber(item[1] as string).div(100)).toNumber(),
          }
        );
      });
      return {
        setDividendsCategoryPercentage: { _dist_list: dist_list },
      };
    },
    validate: sum => ({ isValid: sum === 100, message: 'Allocation must equal 100%.' }),
  },
  [PROPOSAL_TYPE.LOAN_FEE]: {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = PercentMapping[PROPOSAL_TYPE.LOAN_FEE](parseInt(res['origination fee'], 16));
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const origination_fee = Number(Object.values(ratioInputValue)) * 100;
      return { setOriginationFee: { _fee: origination_fee } };
    },
    validate: sum => ({
      isValid: sum <= 10,
      message: 'Must be less than or equal to 10%.',
    }),
  },
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = PercentMapping[PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO](parseInt(res['locking ratio'], 16));

      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const locking_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return { setLockingRatio: { _value: locking_ratio } };
    },
    validate: sum => ({
      isValid: sum < 66.67,
      message: 'Must be less than the liquidation threshold (66.67%).',
    }),
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: {
    fetchInputData: async () => {
      const res = await bnJs.Rebalancing.getPriceChangeThreshold();
      const _percent = PercentMapping[PROPOSAL_TYPE.REBALANCING_THRESHOLD](res);
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const rebalance_ratio = BalancedJs.utils
        .toLoop(Number(Object.values(ratioInputValue)))
        .div(100)
        .toFixed();
      return { setRebalancingThreshold: { _value: rebalance_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
};
