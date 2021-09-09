import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';

const ProposalMapping = {
  daofund: 'DAO fund',
  baln_holders: 'BALN holders',
  Loans: 'Borrower',
};
const getKeyByValue = value => {
  return Object.keys(ProposalMapping).find(key => ProposalMapping[key] === value);
};
export const PROPOSAL_CONFIG = {
  Text: undefined,
  'BALN allocation': {
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
  'Network fee allocation': {
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

  'Loan fee': {
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

  'Loan to value ratio': {
    fetchInputData: async () => {
      const res = await bnJs.Loans.getParameters();
      const _percent = Number((1000000 / parseInt(res['locking ratio'], 16) / 10000).toFixed(2));
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const locking_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return { setLockingRatio: { _ratio: locking_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 80,
      message: 'Must be less than or equal to the liquidation threshold (80%).',
    }),
  },

  'Rebalancing threshold': {
    fetchInputData: async () => {
      const res = await bnJs.Rebalancing.getPriceChangeThreshold();
      const _percent = BalancedJs.utils.toIcx(res).times(100).toFixed();
      return [{ percent: _percent }];
    },
    submitParams: ratioInputValue => {
      const rebalance_ratio = Math.round(1000000 / Number(Object.values(ratioInputValue)));
      return { setRebalancingThreshold: { _ratio: rebalance_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
};
