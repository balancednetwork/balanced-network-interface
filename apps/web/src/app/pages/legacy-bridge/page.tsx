import React from 'react';

import TransferAssetsModal from '@/app/components/BTP/index';
import styled, { css } from 'styled-components';
import { UnderlineText } from '@/app/components/DropdownText';
import { useTransferAssetsModalToggle } from '@/store/application/hooks';
import { SectionPanel } from '@/app/components/Panel';

const BTPButton = styled(UnderlineText)`
  padding-right: 0 !important;
  font-size: 14px;
  padding-bottom: 5px;
  display: inline-block;

  ${({ theme }) =>
    css`
      color: ${theme.colors.primaryBright};
    `};
`;

export function LegacyBridge() {
  const toggleTransferAssetsModal = useTransferAssetsModalToggle();
  const handleBTPButtonClick = () => {
    toggleTransferAssetsModal();
  };

  return (
    <SectionPanel>
      <div>
        <BTPButton onClick={handleBTPButtonClick}>Transfer assets back to their native blockchain</BTPButton>
      </div>
      <TransferAssetsModal />
    </SectionPanel>
  );
}
