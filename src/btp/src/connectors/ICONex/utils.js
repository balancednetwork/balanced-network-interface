import IconService from 'icon-sdk-js';

import { SUCCESS_TRANSACTION } from '../../utils/constants';
import { chainList } from '../chainConfigs';
import { httpProvider } from '../constants';

const { IconAmount, IconUtil } = IconService;
export default class Request {
  constructor(method, params) {
    this.jsonrpc = '2.0';
    this.id = IconUtil.getCurrentTime();
    this.method = method;
    this.params = params;
  }
}

/**
 * Get balance in user-friendly format
 * @param {string|BigNumber|number} balance
 * @returns {string} balance in user-friendly format
 */
export const convertToICX = balance => {
  return IconAmount.of(balance, IconAmount.Unit.LOOP).convertUnit(IconAmount.Unit.ICX).toString();
};

/**
 * Convert to Loop Unit
 * @param {string|BigNumber|number} balance
 * @returns {string} balance as Loop Unit
 */
export const convertToLoopUnit = value => {
  return IconAmount.of(value, IconAmount.Unit.ICX).toLoop();
};

export const makeICXCall = async payload => {
  try {
    return await httpProvider.request(new Request('icx_call', payload)).execute();
  } catch (err) {
    console.log('makeICXCall err', err);
    return 0;
  }
};

/**
 * Reset transfer box UI
 */
export const resetTransferStep = () => {
  const event = new Event(SUCCESS_TRANSACTION);
  document.dispatchEvent(event);
};

export const getICONBSHAddressforEachChain = coinName => {
  const chain = chainList.find(({ COIN_SYMBOL, id }) => COIN_SYMBOL === coinName || coinName.endsWith(id));

  if (!chain) {
    console.error('relevant chain not found');
    return null;
  }

  return chain.ICON_BSH_ADDRESS;
};
