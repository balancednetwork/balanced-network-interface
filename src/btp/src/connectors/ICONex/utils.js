import { httpProvider } from 'btp/src/connectors/constants';
import { SUCCESS_TRANSACTION } from 'btp/src/utils/constants';
import IconService from 'icon-sdk-js';

//{ IconAmount, IconUtil } from 'icon-sdk-js';

export default class Request {
  constructor(method, params) {
    this.jsonrpc = '2.0';
    this.id = IconService.IconUtil.getCurrentTime();
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
  return IconService.IconAmount.of(balance, IconService.IconAmount.Unit.LOOP)
    .convertUnit(IconService.IconAmount.Unit.ICX)
    .toString();
};

/**
 * Convert to Loop Unit
 * @param {string|BigNumber|number} balance
 * @returns {string} balance as Loop Unit
 */
export const convertToLoopUnit = value => {
  return IconService.IconAmount.of(value, IconService.IconAmount.Unit.ICX).toLoop();
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
