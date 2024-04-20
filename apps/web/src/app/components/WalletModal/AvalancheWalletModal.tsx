import React, { useEffect } from 'react';

import { t } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import IconWalletIcon from 'assets/icons/iconex.svg';
import LedgerIcon from 'assets/icons/ledger.svg';
import { useWalletModal } from 'store/application/hooks';

import { VerticalDivider } from '../Divider';
import { ModalContentWrapper } from '../ModalContent';
import { ApplicationModal, WalletModal } from 'store/application/reducer';

const ChainIcons = styled.div``;
const WalletIcons = styled.div``;

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  position: relative;
  align-items: center;
  cursor: pointer;
  padding: 10px 20px;
  margin: 0px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;
  width: 130px;
  max-width: 100px;

  ${ChainIcons}, ${WalletIcons} {
    position: absolute;
    right: 5px;
    bottom: 38px;
    display: flex;
    flex-flow: column;
    opacity: 0.6;

    > * {
      margin-top: 7px;
    }

    img {
      width: 15px;
      height: 15px;
    }
  }

  ${({ theme }) => theme.mediaWidth.up420`
    max-width: 130px;
  `};

  > *:first-child {
    margin-bottom: 10px;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

const UnbreakableText = styled(Text)`
  white-space: nowrap;
`;

export const AvalancheWalletModal = () => {
  const [isOpen, toggle] = useWalletModal(WalletModal.AVALANCHE);
  const upExtraSmall = useMedia('(min-width: 420px)');
  const upSuperExtraSmall = useMedia('(min-width: 364px)');

  const handleConnect = () => {};

  return (
    <>
      <Modal isOpen={isOpen} onDismiss={toggle} maxWidth={360}>
        <ModalContentWrapper>
          <Typography textAlign="center" margin={'0 0 25px'}>
            Connect with:
          </Typography>
          <Flex alignItems="stretch" justifyContent="space-around" flexWrap={upExtraSmall ? 'nowrap' : 'wrap'}>
            <WalletOption onClick={handleConnect}>
              <IconWalletIcon width="50" height="50" />
              <UnbreakableText>Metamask</UnbreakableText>
            </WalletOption>

            {upSuperExtraSmall && <VerticalDivider text={t`or`} />}

            <WalletOption onClick={handleConnect}>
              <LedgerIcon width="50" height="50" />
              <UnbreakableText>Ledger</UnbreakableText>
            </WalletOption>
          </Flex>
        </ModalContentWrapper>
      </Modal>
    </>
  );
};
