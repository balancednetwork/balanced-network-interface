import React, { useState } from 'react';

import { t, Trans } from '@lingui/macro';
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

export default function CommunityListToggle({
  onMessage = t`Add community token list`,
  offMessage = t`Remove community token list`,
}: {
  onMessage?: string;
  offMessage?: string;
}) {
  const tokenListConfig = useTokenListConfig();
  const changeTokenCommunityConfig = useChangeCommunityConfig();
  const [isOpen, setOpen] = useState(false);
  const theme = useTheme();

  const handleConfirm = () => {
    changeTokenCommunityConfig(true);
    setOpen(false);
  };

  const handleRemove = () => {
    changeTokenCommunityConfig(false);
    setOpen(false);
  };

  return (
    <>
      <Typography variant={'span'} color={theme.colors.primary} onClick={() => setOpen(true)}>
        <UnderlineText>{tokenListConfig.community ? offMessage : onMessage}</UnderlineText>
      </Typography>

      <Modal isOpen={isOpen} onDismiss={() => setOpen(false)} maxWidth={400}>
        <ModalContent noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" fontSize={14} color="text2">
            {tokenListConfig.community ? (
              <Trans>Remove community token list?</Trans>
            ) : (
              <Trans>Add community token list?</Trans>
            )}
          </Typography>
          <Typography textAlign="center" padding={tokenListConfig.community ? '5px 0 0' : '5px 0 10px'} fontSize={16}>
            {tokenListConfig.community ? (
              <Trans>You'll only be able to interact with the default assets listed on Balanced.</Trans>
            ) : (
              <Trans>The community list contains all popular assets that aren't listed in the app by default.</Trans>
            )}
          </Typography>

          {!tokenListConfig.community && (
            <Box fontSize={14} sx={{ textAlign: 'center' }}>
              <ExternalLink target="_blank" href={COMMUNITY_TOKEN_LIST_URL}>
                <UnderlineText>
                  <Trans>Review the community token list on GitHub.</Trans>
                </UnderlineText>
              </ExternalLink>
            </Box>
          )}

          <Divider my={4}></Divider>
          <Flex justifyContent="center">
            <TextButton onClick={() => setOpen(false)}>
              <Trans>Cancel</Trans>
            </TextButton>
            {tokenListConfig.community ? (
              <Button onClick={() => handleRemove()}>
                <Trans>Remove token list</Trans>
              </Button>
            ) : (
              <Button onClick={() => handleConfirm()}>
                <Trans>Add token list</Trans>
              </Button>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
