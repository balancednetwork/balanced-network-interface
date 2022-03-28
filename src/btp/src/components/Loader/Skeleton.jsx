import React, { memo } from 'react';

import { colors } from 'btp/src/components/Styles/Colors';
import { media } from 'btp/src/components/Styles/Media';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const Wapper = styled.div`
  float: left;
  border-radius: 4px;
  background-size: 600px;
  animation: shine-lines 1.6s infinite ease-out;
  ${({ width, height, color, bottom }) => `
    width: ${width};
    height: ${height};
    margin-bottom: ${bottom};
    background-image: linear-gradient(
      90deg,
      ${color} 0px,
      rgba(142, 142, 142, 0.8) 40px,
      ${color} 80px
    );
    `};
  ${media.sm`
    max-width: -webkit-fill-available;
  `}

  @keyframes shine-lines {
    0% {
      background-position: -100px;
    }
    40% {
      background-position: 480px;
    }
    100% {
      background-position: 480px;
    }
  }
`;

export const Skeleton = memo(props => {
  return <Wapper {...props} />;
});

Skeleton.displayName = 'Skeleton';

Skeleton.propTypes = {
  /** Color */
  color: PropTypes.string,
  /** Width  */
  width: PropTypes.string,
  /** Height */
  height: PropTypes.string,
  /** Bottom margin */
  bottom: PropTypes.string,
};

Skeleton.defaultProps = {
  width: '192px',
  height: '36px',
  color: colors.grayScaleLoading,
  bottom: '0',
};
