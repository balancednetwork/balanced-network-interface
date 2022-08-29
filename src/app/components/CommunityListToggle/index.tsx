import React, { useState } from 'react';

import { Trans } from '@lingui/macro';
import { Box, Flex } from 'rebass/styled-components';
import { useTheme } from 'styled-components';

import { Typography } from 'app/theme';
import { useChangeCommunityConfig, useTokenListConfig } from 'store/lists/hooks';

import { Button, TextButton } from '../Button';
import Divider from '../Divider';
import { UnderlineText } from '../DropdownText';
import Modal from '../Modal';
import ModalContent from '../ModalContent';
import { ExternalLink } from '../SearchModal/components';

const COMMUNITY_TOKEN_LIST_URL =
  'https://github.com/balancednetwork/balanced-network-interface/blob/master/src/store/lists/communitylist.json';

export default function CommunityListToggle() {
  const tokenListConfig = useTokenListConfig();
  const changeTokenCommunityConfig = useChangeCommunityConfig();
  const [isOpen, setOpen] = useState(false);
  const theme = useTheme();

  const handleConfirm = () => {
    changeTokenCommunityConfig(true);
    setOpen(false);
  };

  return (
    <>
      {!tokenListConfig.community && (
        <Flex justifyContent="center" paddingBottom="10px">
          <Typography color={theme.colors.primary} onClick={() => setOpen(true)}>
            <UnderlineText>
              <Trans>Add community token list</Trans>
            </UnderlineText>
          </Typography>
        </Flex>
      )}

      <Modal isOpen={isOpen} onDismiss={() => setOpen(false)}>
        <ModalContent noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" fontSize={14} color="text2">
            <Trans>Add community token list?</Trans>
          </Typography>
          <Typography textAlign="center" padding="5px 0 10px">
            <Trans>The community list contains all popular assets that aren't listed in the app by default.</Trans>
          </Typography>
          <Box fontSize={14} sx={{ textAlign: 'center' }}>
            <ExternalLink target="_blank" href={COMMUNITY_TOKEN_LIST_URL}>
              <UnderlineText>
                <Trans>Review the community token list on GitHub.</Trans>
              </UnderlineText>
            </ExternalLink>
          </Box>
          <Divider my={4}></Divider>
          <Flex justifyContent="center">
            <TextButton onClick={() => setOpen(false)}>
              <Trans>Cancel</Trans>
            </TextButton>
            <Button onClick={() => handleConfirm()}>
              <Trans>Add token list</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
