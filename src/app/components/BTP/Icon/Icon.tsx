import React, { memo } from 'react';

import { ReactComponent as bchIcon } from 'btp/src/assets/images/bch-icon.svg';
import binanceLogo from 'btp/src/assets/images/binance-logo.png';
import binanceIcon from 'btp/src/assets/images/BNB.png';
import bnUSDIcon from 'btp/src/assets/images/bnUSD.png';
import { ReactComponent as btcIcon } from 'btp/src/assets/images/btc-icon.svg';
import BTCBIcon from 'btp/src/assets/images/BTCB.png';
import BUSDIcon from 'btp/src/assets/images/BUSD.png';
import { ReactComponent as copyIcon } from 'btp/src/assets/images/copy-icon.svg';
import defaultCoin from 'btp/src/assets/images/default-coin.png';
import { ReactComponent as ethIcon } from 'btp/src/assets/images/eth-icon.svg';
import hanaIcon from 'btp/src/assets/images/hana-wallet.png';
import HamornyICon from 'btp/src/assets/images/harmony-icon.png';
import iconLogo from 'btp/src/assets/images/icon-logo.png';
import { ReactComponent as metaMaskIcon } from 'btp/src/assets/images/metal-mask.svg';
// import { ReactComponent as nearIcon } from 'btp/src/assets/images/near-icon.svg';
import sICXIcon from 'btp/src/assets/images/sICX.png';
import USDCIcon from 'btp/src/assets/images/USDC.png';
import USDTIcon from 'btp/src/assets/images/USDT.png';
import { wallets } from 'btp/src/utils/constants';
import styled from 'styled-components/macro';

import { ReactComponent as iconexIcon } from 'assets/icons/iconex.svg';

const sizes = {
  s: '20px',
  m: '25.67px',
};
type Custom = {
  size: number;
  width: number;
  margin?: string;
};

const StyledIcon = styled.img<Custom>`
  width: ${({ width, size }) => sizes[size] || width};
  margin: ${({ margin }) => margin || '0'};
  vertical-align: middle;

  /* Fix image gets blur when resize */
  image-rendering: -moz-crisp-edges; /* Firefox */
  image-rendering: -o-crisp-edges; /* Opera */
  image-rendering: -webkit-optimize-contrast; /* Webkit (non-standard naming) */
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor; /* IE (non-standard property) */
`;

const SVGWrapper = styled.span<Custom>`
  width: ${({ width, size }) => sizes[size] || width};
  margin: ${({ margin }) => margin || '0'};
  display: inline-block;
  line-height: 0;
  vertical-align: middle;

  > svg {
    width: 100%;
    height: 100%;

    path {
      ${({ color }) => (color ? `fill: ${color}` : '')}
    }
  }
`;

export const Icon = memo(
  ({ icon = 'metamask', width = '25.67px', size, margin, iconURL, SVGComp, color, ...props }: any) => {
    const icons = {
      metamask: metaMaskIcon,
      ICON: iconLogo,
      ICX: iconexIcon,
      [wallets.iconex]: iconexIcon,
      [wallets.hana]: hanaIcon,
      ETH: ethIcon,
      copy: copyIcon,
      BSC: binanceLogo,
      binance: binanceIcon,
      BNB: binanceIcon,
      btc: btcIcon,
      bch: bchIcon,
      // NEAR: nearIcon,
      ONE: HamornyICon,
      bnUSD: bnUSDIcon,
      BTCB: BTCBIcon,
      BUSD: BUSDIcon,
      sICX: sICXIcon,
      USDC: USDCIcon,
      USDT: USDTIcon,
      defaultCoin,
    };

    const MySource = SVGComp || (!iconURL && icons[icon]) || iconURL || icons.ICX;
    const isImagePath = iconURL || (typeof MySource === 'string' && MySource.includes('/'));

    return (
      <>
        {!isImagePath ? (
          <SVGWrapper color={color} width={width} size={size} margin={margin} className="icon">
            <MySource />
          </SVGWrapper>
        ) : (
          <StyledIcon
            src={MySource || iconURL || iconexIcon}
            alt="wallet icon"
            loading="lazy"
            width={width}
            size={size}
            margin={margin}
            className="icon"
            {...props}
          />
        )}
      </>
    );
  },
);

Icon.displayName = 'Icon';
