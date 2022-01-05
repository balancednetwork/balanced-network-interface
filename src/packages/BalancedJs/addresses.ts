import { SupportedChainId as NetworkId } from './chain';

const MAINNET_ADDRESSES = {
  loans: 'cx66d4d90f5f113eba575bf793570135f9b10cece1',
  staking: 'cx43e2eec79eb76293c298f2b17aec06097be606e0',
  dividends: 'cx203d9cd2a669be67177e997b8948ce2c35caffae',
  reserve: 'cxf58b9a1898998a31be7f1d99276204a3333ac9b3',
  daofund: 'cx835b300dcfe01f0bdb794e134a0c5628384f4367',
  rewards: 'cx10d59e8103ab44635190bd4139dbfd682fa2d07e',
  dex: 'cxa0af3165c08318e988cb30993b3048335b94af6c',
  rebalancing: 'cx40d59439571299bca40362db2a7d8cae5b0b30b0',
  governance: 'cx44250a12074799e26fdeee75648ae47e2cc84219',
  band: 'cxe647e0af68a4661566f5e9861ad4ac854de808a2',
  router: 'cx21e94c08c03daee80c25d8ee3ea22a20786ec231',
  sicx: 'cx2609b924e33ef00b648a409245c7ea394c467824',
  bnusd: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
  baln: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
  bwt: 'cxcfe9d1f83fa871e903008471cca786662437e58d',
  stakedLp: '',
};

const YEOUIDO_ADDRESSES = {
  loans: 'cx20cd779f584774f5191545f06873551c8e748fe6',
  staking: 'cxe974cafa693ca3a14292a35e4593347799d7de17',
  dividends: 'cx4bf35a11f49040c7726d6e5bfe606b7c83a5bebf',
  reserve: 'cx0f10af74e4f79f339f34e3648a006f526e3c4b63',
  daofund: 'cx4d3c7b8f59662c0946eb69eb3e6a0dbce2cecb6a',
  rewards: 'cxfb74dc7fb33ec9fa0da0f09e3faaebb0b153d06f',
  dex: 'cx759f611f9fee49f4ba163070a6b157b863f5fbc3',
  governance: 'cxcf64d3520d5d9224d2fe57ba5ac8b88a94f395e4',
  band: 'cx61a36e5d10412e03c907a507d1e8c6c3856d9964',
  router: 'cx607ed2dc0576a3ed916eb344f6f035033a9e4c50',
  sicx: 'cx81730290ed56a72539c531ceb8346a4f15b19d0a',
  bnusd: 'cx7bd90c91db9b0be9f688442dce7569aebb1ff7fe',
  baln: 'cx40b768f5834a124ea242f9741b853af804fb497f',
  bwt: 'cx81214e6f8efdac9843e25a4a9b8322126a755218',
  rebalancing: 'cx03ebfe239c69aee14df2e3435cd0824fd3e75904',
  stakedLp: 'cxc8840892de6a5bc5c69bfca7346967943aa51a69',
};

const SEJONG_ADDRESSES = {
  loans: 'cxc5e1eae2f3560f266ea35fe34b1a39db9c99cc69',
  staking: 'cxfbf525229307669cbf8be7faddbe48c96fb52209',
  dividends: 'cx5f123b9a221882d92c508a7eaf0c66bb11e1c216',
  reserve: 'cxf07d3baf2eecdad496468b1047f68bb90036136c',
  daofund: 'cxb67b8445b679c32fa0f95278f9263674a2bdcc1f',
  rewards: 'cxdbbd4deb3e46d3dff280406d2c795cdfcd1ebcfd',
  dex: 'cx648a6d9c5f231f6b86c0caa9cc9eff8bd6040999',
  rebalancing: 'cxaa6f520b655d5fb2d43feae45e83d093c88f58f6',
  governance: 'cx541e2e8b9673e736b727e3f6313ada687539f50f',
  band: 'cx900e2d17c38903a340a0181523fa2f720af9a798',
  router: 'cxf9e996d3ab20b83ed6bacb28ebf157c484c4b695',
  sicx: 'cx70806fdfa274fe12ab61f1f98c5a7a1409a0c108',
  bnusd: 'cx5838cb516d6156a060f90e9a3de92381331ff024',
  baln: 'cx303470dbc10e5b4ab8831a61dbe00f75db10c38b',
  bwt: 'cx68b822ae2acc76e9ec6143a8afbeb79e50a26e8f',
  stakedLp: 'cx0c3848f0fbb714fcb104e909e3fc1250b8cf9e7f',
};

const addresses = {
  [NetworkId.MAINNET]: MAINNET_ADDRESSES,
  [NetworkId.YEOUIDO]: YEOUIDO_ADDRESSES,
  [NetworkId.SEJONG]: SEJONG_ADDRESSES,
};

export default addresses;
