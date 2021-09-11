import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';

const ProposalMapping = {
  daofund: 'DAO fund',
  baln_holders: 'BALN holders',
  Loans: 'Borrowers',
  DAOfund: 'DAO fund',
  'Reserve Fund': 'Reserve',
  'Worker Tokens': 'Workers',
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

export const RATIO_VALUE_FORMATTER = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: data => {
    // debugger;
    return data.map(({ recipient_name, dist_percent }) => ({
      name: ProposalMapping[recipient_name] || recipient_name,
      percent: BalancedJs.utils
        .toIcx(dist_percent as string)
        .times(100)
        .toFixed(),
    }));
  },
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: data => {
    return data.map((item: { [key: string]: number }) => {
      const _item = Object.entries(item)[0];
      return {
        name: ProposalMapping[_item[0]] || _item[0],
        percent: (Math.round(Number(BalancedJs.utils.toIcx(_item[1]).times(10000))) / 100).toFixed(2),
      };
    });
  },
  [PROPOSAL_TYPE.LOAN_FEE]: (data: number) => {
    const _percent = Number((data / 100).toFixed(2));
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: (data: number) => {
    const _percent = Math.round(Number(1000000 / data));
    return [{ percent: _percent }];
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: data => {
    const _percent = Number(BalancedJs.utils.toIcx(data).times(100).toFixed(2));
    return [{ percent: _percent }];
  },
};

const getKeyByValue = value => {
  return Object.keys(ProposalMapping).find(key => ProposalMapping[key] === value);
};

export const PROPOSAL_CONFIG = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: {
    fetchInputData: async () =>
      Object.entries(await bnJs.Rewards.getRecipientsSplit()).map(item => ({
        name: ProposalMapping[item[0]] || item[0],
        percent: BalancedJs.utils
          .toIcx(item[1] as string)
          .times(100)
          .toFixed(),
      })),
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
      return Object.entries(res).map(item => ({
        name: ProposalMapping[item[0]] || item[0],
        percent: BalancedJs.utils
          .toIcx(item[1] as string)
          .times(100)
          .toFixed(),
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
      const _percent = Number((parseInt(res['origination fee'], 16) / 100).toFixed(2));
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
      const _percent = Math.round(Number(1000000 / parseInt(res['locking ratio'], 16)));

      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const locking_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return { setLockingRatio: { _ratio: locking_ratio } };
    },
    validate: sum => ({
      isValid: sum < 66.67,
      message: 'Must be less than the liquidation threshold (66.67%).',
    }),
  },
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: {
    fetchInputData: async () => {
      const res = await bnJs.Rebalancing.getPriceChangeThreshold();
      const _percent = BalancedJs.utils.toIcx(res).times(100).toFixed();
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const rebalance_ratio = BalancedJs.utils
        .toLoop(Number(Object.values(ratioInputValue)))
        .div(100)
        .toFixed();
      return { setRebalancingThreshold: { _ratio: rebalance_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
};
