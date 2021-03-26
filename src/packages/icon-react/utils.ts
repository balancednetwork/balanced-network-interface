import BigNumber from 'bignumber.js';
import { IconConverter, IconAmount } from 'icon-sdk-js';

export function convertLoopToIcx(value: BigNumber): BigNumber {
  return IconConverter.toBigNumber(IconAmount.of(value, IconAmount.Unit.LOOP).convertUnit(IconAmount.Unit.ICX));
}

export function convertIcxToLoop(value: BigNumber) {
  return IconAmount.of(value, IconAmount.Unit.ICX).toLoop();
}

export function numberWithCommas(value: BigNumber) {
  return value.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
