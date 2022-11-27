import IconService from 'icon-sdk-js';

import { ICX_METHOD, JSON_RPC, SUCCESS_TRANSACTION } from '../../utils/constants';
import { findChainbySymbol } from '../chainConfigs';
import { httpProvider } from '../constants';

const { IconAmount, IconUtil } = IconService;
export default class Request {
  constructor(method, params) {
    this.jsonrpc = JSON_RPC;
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
    return await httpProvider.request(new Request(ICX_METHOD.CALL, payload)).execute();
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

/**
 * Get BSH address
 * @param {string} coinName
 * @returns {string} BSH address on ICON side for that coin OR token from other chains
 */
export const getICONBSHAddressforEachChain = symbol => {
  return findChainbySymbol(symbol)?.ICON_BTS_CORE;
};
