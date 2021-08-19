import { Token } from 'types/balanced-sdk-core/index';

import { SupportedChainId } from './chains';

export const sICX = new Token(
  SupportedChainId.MAINNET,
  'cx2609b924e33ef00b648a409245c7ea394c467824',
  18,
  'sICX',
  'Staked ICX',
);
export const bnUSD = new Token(
  SupportedChainId.MAINNET,
  'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
  18,
  'bnUSD',
  'Balanced Dollar',
);
export const BALN = new Token(
  SupportedChainId.MAINNET,
  'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
  6,
  'USDC',
  'USD//C',
);
export const IUSDC = new Token(
  SupportedChainId.MAINNET, //
  '',
  6,
  'IUSDC',
  'IUSDC',
);
export const USDS = new Token(
  SupportedChainId.MAINNET, //
  '',
  18,
  'USDS',
  'USDS',
);

// yeouido
export const sICX_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxae6334850f13dfd8b50f8544d5acb126bb8ef82d',
  18,
  'sICX',
  'Staked ICX',
);
export const bnUSD_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a',
  18,
  'bnUSD',
  'Balanced Dollar',
);
export const BALN_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cx36169736b39f59bf19e8950f6c8fa4bfa18b710a',
  6,
  'USDC',
  'USD//C',
);
export const IUSDC_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO, //
  'cx65f639254090820361da483df233f6d0e69af9b7',
  6,
  'IUSDC',
  'IUSDC',
);
export const USDS_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO, //
  'cxc0666df567a6e0b49342648e98ccbe5362b264ea',
  18,
  'USDS',
  'USDS',
);
