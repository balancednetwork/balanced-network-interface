import BigNumber from 'bignumber.js';
import { BalancedJs, SupportedChainId as NetworkId } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { addressToCurrencyKeyMap } from 'constants/currency';

import { CurrencyValue } from '../../components/newproposal/FundingInput';

export const MAX_RATIO_VALUE = 100;

export const CURRENCY_LIST = ['BALN', 'bnUSD', 'sICX'];

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
  FUNDING = 'Funding',
}

export const ActionsMapping = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: ['updateBalTokenDistPercentage', 'updateDistPercent'],
  [PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION]: ['setDividendsCategoryPercentage'],
  [PROPOSAL_TYPE.LOAN_FEE]: ['setOriginationFee', 'update_origination_fee'],
  [PROPOSAL_TYPE.LOAN_TO_VALUE_RATIO]: ['setLockingRatio', 'update_locking_ratio'],
  [PROPOSAL_TYPE.REBALANCING_THRESHOLD]: ['setRebalancingThreshold'],
  [PROPOSAL_TYPE.FUNDING]: ['daoDisburse'],
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
    return data.map(({ recipient_name, dist_percent }) => ({
      name: ProposalMapping[recipient_name] || recipient_name,
      percent: PercentMapping[PROPOSAL_TYPE.BALN_ALLOCATION](dist_percent),
    }));
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

const getKeyByValue = (value, mapping) => {
  return Object.keys(mapping).find(key => mapping[key] === value);
};

export const PROPOSAL_CONFIG = {
  [PROPOSAL_TYPE.BALN_ALLOCATION]: {
    fetchInputData: async () =>
      Object.entries(await bnJs.Rewards.getRecipientsSplit()).map(item => ({
        name: ProposalMapping[item[0]] || item[0],
        percent: PercentMapping[PROPOSAL_TYPE.BALN_ALLOCATION](item[1]),
      })),
    submitParams: ratioInputValue => {
      const recipientList = Object.entries(ratioInputValue).map(item => ({
        recipient_name: getKeyByValue(item[0], ProposalMapping) || item[0],
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
        percent: PercentMapping[PROPOSAL_TYPE.NETWORK_FEE_ALLOCATION](item[1]),
      }));
    },
    submitParams: ratioInputValue => {
      const dist_list = Object.entries(ratioInputValue).map(item => {
        const key = getKeyByValue(item[0], ProposalMapping);
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
        .toNumber();
      return { setRebalancingThreshold: { _value: rebalance_ratio } };
    },
    validate: sum => ({
      isValid: sum <= 7.5,
      message: 'Must be less than or equal to 7.5%.',
    }),
  },
  [PROPOSAL_TYPE.FUNDING]: {
    fetchInputData: async () => {
      const res = await bnJs.DAOFund.getBalances();
      return Object.entries(res).map(item => {
        return {
          symbol:
            addressToCurrencyKeyMap[NetworkId.YEOUIDO][item[0]] ||
            addressToCurrencyKeyMap[NetworkId.MAINNET][item[0]] ||
            item[0],
          amount: BalancedJs.utils.toIcx(item[1] as string),
        };
      });
    },
    submitParams: (currencyValue: CurrencyValue) => {
      const amounts = Object.values(currencyValue.amounts)
        .map(
          ({ amount, symbol }) =>
            amount && {
              amount: BalancedJs.utils.toLoop(amount).toNumber(),
              address:
                getKeyByValue(symbol, addressToCurrencyKeyMap[NetworkId.YEOUIDO]) ||
                getKeyByValue(symbol, addressToCurrencyKeyMap[NetworkId.MAINNET]),
            },
        )
        .filter(value => value);
      return { daoDisburse: { _recipient: currencyValue.recipient, _amounts: amounts } };
    },
  },
};
