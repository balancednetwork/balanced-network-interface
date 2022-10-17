import React, { memo } from 'react';

import { ReactComponent as bchIcon } from 'btp/src/assets/images/bch-icon.svg';
import { ReactComponent as binanceIcon } from 'btp/src/assets/images/binance-icon.svg';
import { ReactComponent as btcIcon } from 'btp/src/assets/images/btc-icon.svg';
import { ReactComponent as copyIcon } from 'btp/src/assets/images/copy-icon.svg';
import { ReactComponent as ethIcon } from 'btp/src/assets/images/eth-icon.svg';
import { ReactComponent as iconexIcon } from 'btp/src/assets/images/icon-ex.svg';
import { ReactComponent as metaMaskIcon } from 'btp/src/assets/images/metal-mask.svg';
import MBIcon from 'btp/src/assets/images/moonbeam.jpeg';
import { ReactComponent as nearIcon } from 'btp/src/assets/images/near-icon.svg';
import { wallets } from 'btp/src/utils/constants';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const sizes = {
  s: '20px',
  m: '25.67px',
};

const StyledIcon = styled.img`
  width: ${({ width, size }) => sizes[size] || width};
  vertical-align: middle;

  /* Fix image gets blur when resize */
  image-rendering: -moz-crisp-edges; /* Firefox */
  image-rendering: -o-crisp-edges; /* Opera */
  image-rendering: -webkit-optimize-contrast; /* Webkit (non-standard naming) */
  image-rendering: crisp-edges;
  -ms-interpolation-mode: nearest-neighbor; /* IE (non-standard property) */
`;

const SVGWrapper = styled.span`
  width: ${({ width, size }) => sizes[size] || width};
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

export const Icon = memo(({ icon = 'metamask', width = '25.67px', size, iconURL, SVGComp, color, ...props }) => {
  const icons = {
    metamask: metaMaskIcon,
    ICX: iconexIcon,
    [wallets.iconex]: iconexIcon,
    ETH: ethIcon,
    copy: copyIcon,
    binance: binanceIcon,
    BNB: binanceIcon,
    btc: btcIcon,
    bch: bchIcon,
    DEV: MBIcon,
    // NEAR: nearIcon,
  };

  const MySource = SVGComp || (!iconURL && icons[icon]) || iconURL || icons.ICX;
  const isImagePath = iconURL || (typeof MySource === 'string' && MySource.includes('/'));

  return (
    <>
      {!isImagePath ? (
        <SVGWrapper color={color} width={width} size={size} className="icon">
          <MySource />
        </SVGWrapper>
      ) : (
        <StyledIcon
          src={MySource || iconURL || iconexIcon}
          alt="wallet icon"
          loading="lazy"
          width={width}
          size={size}
          className="icon"
          {...props}
        />
      )}
    </>
  );
});

Icon.displayName = 'Icon';

Icon.propTypes = {
  /** Available sizes */
  size: PropTypes.oneOf(['s', 'm']),
  /** Custome width and overrride size */
  width: PropTypes.string,
  /** List of avalable icons */
  icon: PropTypes.oneOf([
    wallets.metamask,
    wallets.iconex,
    'ICX',
    'ETH',
    'copy',
    'binance',
    'BNB',
    'btc',
    'bch',
    'DEV',
    // 'NEAR',
  ]),
  /** Display icon with URL */
  iconURL: PropTypes.string,
  /** Display icon with SVG component */
  SVGComp: PropTypes.node,
  /** Set color for icon with SVG component */
  color: PropTypes.string,
};
