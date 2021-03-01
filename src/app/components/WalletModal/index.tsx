import React from 'react';

import { useIconReact } from 'packages/icon-react';
import { Flex, Box, Text } from 'rebass/styled-components';
import styled from 'styled-components';

import { VerticalDivider } from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import { ReactComponent as IconexIcon } from 'assets/icons/iconex.svg';
import { ReactComponent as LedgerIcon } from 'assets/icons/ledger.svg';
import { ApplicationModal } from 'store/application/actions';
import { useWalletModalToggle, useModalOpen } from 'store/application/hooks';

const WalletOption = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 5px 20px;
  margin: 0px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: white;
  user-select: none;

  > *:first-child {
    margin-bottom: 10px;
  }

  :hover {
    background-color: ${({ theme }) => theme.colors.bg3};
    opacity: 1;
  }
`;

const StyledModal = styled(Modal).attrs({
  'aria-label': 'dialog',
})`
  &[data-reach-dialog-content] {
    width: 300px;
  }
`;

export default function WalletModal() {
  const walletModalOpen = useModalOpen(ApplicationModal.WALLET);
  const toggleWalletModal = useWalletModalToggle();

  const { requestAddress, hasExtension } = useIconReact();

  const handleOpenWallet = () => {
    toggleWalletModal();
    requestAddress();
  };

  return (
    <StyledModal isOpen={walletModalOpen} onDismiss={toggleWalletModal}>
      <Box mx="auto" my={5}>
        <Typography textAlign="center" mb={5}>
          Sign in with:
        </Typography>

        <Flex alignItems="stretch" justifyContent="space-between">
          {hasExtension ? (
            <WalletOption onClick={handleOpenWallet}>
              <IconexIcon width="50" height="50" />
              <Text>ICONex</Text>
            </WalletOption>
          ) : (
            <WalletOption
              as="a"
              href="https://chrome.google.com/webstore/detail/iconex/flpiciilemghbmfalicajoolhkkenfel?hl=en"
            >
              <IconexIcon width="50" height="50" />
              <Text>ICONex</Text>
            </WalletOption>
          )}

          <VerticalDivider text="or"></VerticalDivider>

          <WalletOption>
            <LedgerIcon width="50" height="50" />
            <Text>Ledger</Text>
          </WalletOption>
        </Flex>
      </Box>
    </StyledModal>
  );
}
