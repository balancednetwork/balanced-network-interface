import BigNumber from 'bignumber.js';
import { IconConverter, IconAmount } from 'icon-sdk-js';

// we can't configure the icon-sdk-js bignumber.js preferences such as rounding mode, format, and so on.
// so just wrapped the IconConverter.toBigNumber return with our project's bignumber.js.
export function convertLoopToIcx(value: BigNumber): BigNumber {
  return new BigNumber(
    IconConverter.toBigNumber(IconAmount.of(value, IconAmount.Unit.LOOP).convertUnit(IconAmount.Unit.ICX)),
  );
}

export function convertIcxToLoop(value: BigNumber) {
  return IconAmount.of(value, IconAmount.Unit.ICX).toLoop();
}

export function numberWithCommas(value: BigNumber) {
  return value.toFixed().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
