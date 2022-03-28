import React from 'react';

import checkIcon from 'btp/src/assets/images/check-icon.svg';
import { Icon } from 'btp/src/components/Icon';
import { Loader } from 'btp/src/components/Loader';
import { colors } from 'btp/src/components/Styles/Colors';
import { media } from 'btp/src/components/Styles/Media';
import { Text } from 'btp/src/components/Typography';
import { wallets } from 'btp/src/utils/constants';
import PropTypes from 'prop-types';
import styled from 'styled-components/macro';

const { grayText, successState, grayAccent } = colors;

const StyledWalletItem = styled.button`
  margin: 0 0 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  width: 416px;
  height: 72px;
  padding: 0 28.5px;
  background: transparent;
  color: ${grayText};

  .wallet-title {
    margin-right: auto;
    margin-left: 13.3px;
  }

  span {
    grid-column: 3;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: 18px;
    color: ${successState};
  }

  &:hover,
  :focus {
    background: ${grayAccent};
    border-radius: 4px;
  }

  .wallet-img {
    img {
      width: inherit;
    }
  }

  ${media.md`
    width: 100%;
  `};
`;

export const WalletSelector = ({ wallet, type, active, onClick, isInstalled, isCheckingInstalled }) => {
  return (
    <StyledWalletItem className="wallet-selector" autoFocus={active} onClick={isCheckingInstalled ? () => {} : onClick}>
      <Icon className="wallet-img" iconURL={wallet[type].icon} width="32px" />
      <Text className="md wallet-title">
        {!isInstalled && !isCheckingInstalled && 'Install '}
        {wallet[type].title}
      </Text>
      {!active && isCheckingInstalled && <Loader size="25px" borderSize="3px" />}
      {active && <img src={checkIcon} alt="icon" />}
    </StyledWalletItem>
  );
};

WalletSelector.propTypes = {
  /** Allowed wallets defination */
  wallet: PropTypes.object,
  /** Current selected wallet */
  type: PropTypes.oneOf([wallets.metamask, wallets.iconex, wallets.hana, wallets.near]),
  /** Is selected wallet */
  active: PropTypes.bool,
  /** Handle clicking */
  onClick: PropTypes.func,
  /** Is wallet installed*/
  isInstalled: PropTypes.bool,
  /** Is checking wallet installed */
  isCheckingInstalled: PropTypes.bool,
};
