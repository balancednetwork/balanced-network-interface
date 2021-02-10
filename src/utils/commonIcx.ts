import { IconBuilder, IconConverter, IconAmount } from 'icon-sdk-js';
import IconService from 'icon-sdk-js/build/icon-sdk-js.web.min.js';

const GOVERNANCE_ADDRESS = 'cx0000000000000000000000000000000000000001';

export const iconService = new IconService(new IconService.HttpProvider('http://35.240.219.80:9000/api/v3'));

export const getDefaultStepCost = async () => {
  const builder = new IconBuilder.CallBuilder();
  const getStepCostsCall = builder.to(GOVERNANCE_ADDRESS).method('getStepCosts').build();
  const { default: defaultStepCost } = await iconService.call(getStepCostsCall).execute();
  return defaultStepCost;
};

export const API_VERSION = IconConverter.toBigNumber(3);

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export function convertLoopToIcx(value) {
  return IconConverter.toBigNumber(IconAmount.of(value, IconAmount.Unit.LOOP).convertUnit(IconAmount.Unit.ICX));
}

export function convertIcxToLoop(value) {
  return IconAmount.of(value, IconAmount.Unit.ICX).toLoop();
}

export function numberWithCommas(value) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
