// import { IconAmount } from 'icon-sdk-js';

import { BALN, Dex, /* DummyOracle, */ Icd, Loans, /* Rewards, */ SICX, Staking } from '.';
import { GetPriceDexPID } from './dex';

export const main = async account => {
  if (!account) return;

  const baln = new BALN(account);
  const dex = new Dex(account);
  // const dummyOracle = new DummyOracle(account);
  const icd = new Icd(account);
  const loans = new Loans(account);
  // const rewards = new Rewards(account);
  const sICX = new SICX(account);
  const staking = new Staking(account);

  // baln - OK
  const baln_balanceOf = await baln.balanceOf();
  console.log('baln_balanceOf', baln_balanceOf);

  // dex
  // #error - blockchain response msg: invalid literal for int() with base 10: 'cxdfa188a9ef06d9e6a5118b9c73c3fac1567bc889'
  // const dex_balanceOf = await dex.balanceOf();
  // console.log('dex_balanceOf', dex_balanceOf);

  const dex_getPrice_BALNbnUSDpool = await dex.getPrice({
    _pid: GetPriceDexPID.BALNbnUSDpool,
  });
  console.log('dex_getPrice_BALNbnUSDpool', dex_getPrice_BALNbnUSDpool);
  const dex_getPrice_sICXbnUSDpool = await dex.getPrice({
    _pid: GetPriceDexPID.sICXbnUSDpool,
  });
  console.log('dex_getPrice_sICXbnUSDpool', dex_getPrice_sICXbnUSDpool);

  // // dummy oracle - OK
  // const dummyOracle_getReferenceData = await dummyOracle.getReferenceData({ _base: 'ICX', _quote: 'USD' });
  // console.log('dummyOracle_getReferenceData', dummyOracle_getReferenceData);

  // icd - OK
  const icd_balanceOf = await icd.balanceOf();
  console.log('icd_balanceOf', icd_balanceOf);
  const icd_totalSupply = await icd.totalSupply();
  console.log('icd_totalSupply', icd_totalSupply);

  // loans - OK
  const loans_getAccountPositions = await loans.getAccountPositions();
  console.log('loans_getAccountPositions', loans_getAccountPositions);
  const loans_getAvailableAssets = await loans.getAvailableAssets();
  console.log('loans_getAvailableAssets', loans_getAvailableAssets);

  // // loans collateral - PENDING
  // const value = 1;
  // const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
  // const data2 = Buffer.from(
  //   '", "_asset": "ICD", "_amount": ' + IconAmount.of(value, IconAmount.Unit.ICX).toLoop() + '}}',
  //   'utf8',
  // ).toString('hex');
  // const params = { _data1: data1, _data2: data2 };

  // const loans_addCollateral_Payload = loans.getCollateralTransactionPayload({
  //   method: 'addCollateral',
  //   value,
  //   params,
  // });
  // console.log('loans_addCollateral_Payload', loans_addCollateral_Payload);

  // const loans_withdrawCollateral_Payload = loans.getCollateralTransactionPayload({
  //   method: 'withdrawCollateral',
  //   value,
  //   params,
  // });
  // console.log('loans_withdrawCollateral_Payload', loans_withdrawCollateral_Payload);

  // // rewards - PENDING
  // const rewards_getClaimRewardsTransactionPayload = rewards.getClaimRewardsTransactionPayload();
  // console.log('rewards_getClaimRewardsTransactionPayload', rewards_getClaimRewardsTransactionPayload);

  // sICX - OK
  const sICX_balanceOf = await sICX.balanceOf();
  console.log('sICX_balanceOf', sICX_balanceOf);

  // staking - OK
  const staking_getTodayRate = await staking.getTodayRate();
  console.log('staking_getTodayRate', staking_getTodayRate);
};
