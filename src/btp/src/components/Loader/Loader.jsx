import React, { memo } from 'react';

import { colors } from 'btp/src/components/Styles/Colors';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const Wapper = styled.div`
  ${({ color, size, borderSize }) => `
    border: ${borderSize} solid ${color};
    border-top: ${borderSize} solid transparent;

    width: ${size};
    height: ${size};
  `}

  border-radius: 50%;
  animation: spin 2s linear infinite;
  display: inline-block;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const Loader = memo(props => {
  return <Wapper {...props} />;
});

Loader.displayName = 'Loader';

Loader.propTypes = {
  /** Line color */
  color: PropTypes.string,
  /** Width and Height, e.g. 10px */
  size: PropTypes.string,
  /** Line weight */
  borderSize: PropTypes.string,
};

Loader.defaultProps = {
  color: colors.primaryBrand,
  size: '83.83px',
  borderSize: '8.33px',
};
