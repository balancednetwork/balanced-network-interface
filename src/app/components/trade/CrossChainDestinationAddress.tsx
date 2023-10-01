import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { SupportedXCallChains } from 'app/_xcall/types';
import { Typography } from 'app/theme';

const AddressWrap = styled.div`
  flex-grow: 1;
`;

const AddressInput = styled.input`
  background: ${({ theme }) => theme.colors.bg4};
  border: 2px solid ${({ theme }) => theme.colors.bg4};
  transition: border 0.3s ease;
  border-radius: 0 0 10px 10px;
  width: 100%;
  padding-left: 15px;
  padding-right: 15px;
  color: ${({ theme }) => theme.colors.text1};
  font-size: 14px;
  height: 35px;

  &:hover,
  &:focus,
  &:active {
    outline: none;
  }
`;

type CrossChainDestinationAddressProps = {
  currency?: Currency;
  isChainDifference: boolean;
  destinationChain: SupportedXCallChains;
  destinationAddress?: string;
  setDestinationChain: (chain: SupportedXCallChains) => void;
  setDestinationAddress: (address: string) => void;
};

const CrossChainDestinationAddress = ({
  currency,
  isChainDifference,
  destinationChain,
  setDestinationChain,
  destinationAddress,
  setDestinationAddress,
}: CrossChainDestinationAddressProps) => {
  const { account } = useIconReact();
  const { address: accountArch } = useArchwayContext();
  // const isCrossChainToken = Object.keys(CROSSCHAIN_SUPPORTED_TOKENS).includes(currency?.wrapped.address || '');
  const [inputUntouched, setInputUntouched] = React.useState(true);

  React.useEffect(() => {
    if (!destinationAddress && inputUntouched) {
      if (destinationChain === 'icon') {
        setDestinationAddress(account || '');
      }
      if (destinationChain === 'archway') {
        setDestinationAddress(accountArch || '');
      }
    }
  }, [account, accountArch, destinationAddress, destinationChain, inputUntouched, setDestinationAddress]);

  React.useEffect(() => {
    return () => {
      setDestinationAddress('');
      setInputUntouched(true);
    };
  }, [setDestinationAddress, destinationChain]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUntouched(false);
    setDestinationAddress(e.target.value);
  };

  const getChainName = (): string => {
    if (destinationChain === 'icon') {
      return 'ICON';
    }
    if (destinationChain === 'archway') {
      return 'Archway';
    }
    return '';
  };

  return (
    <Box style={{ transform: 'translateY(-19px)' }}>
      <AnimatePresence>
        {isChainDifference && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 25 }}
            exit={{ opacity: 0, height: 0 }}
            key="destination-address"
            transition={{ duration: 0.3 }}
          >
            <Flex width="100%" justifyContent="space-between" pt="5px" alignItems="center">
              <Typography mr="3">Receive in:</Typography>
              <AddressWrap>
                <AddressInput
                  value={destinationAddress}
                  onChange={handleAddressChange}
                  type="text"
                  placeholder={t`Your ${getChainName()} address`}
                />
              </AddressWrap>
            </Flex>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default CrossChainDestinationAddress;
