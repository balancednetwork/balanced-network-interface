import React from 'react';

import { Box, Flex } from 'rebass';

import { Typography } from 'app/theme';
import { shortenAddress } from 'utils';

import { UnderlineText } from '../DropdownText';

type WalletItemProps = {
  address: string | null | undefined;
  name: string;
  logo: JSX.Element;
  connect: () => void;
  disconnect: () => void;
  description: string;
  border: boolean;
};

const WalletItem = ({ address, name, logo, connect, disconnect, description, border }: WalletItemProps) => {
  return (
    <Flex className={border ? 'border-bottom' : ''} py={3} alignItems="center" flexWrap={['wrap', 'nowrap']}>
      <Box>{logo}</Box>
      <Box ml={3}>
        <Typography fontWeight="bold" color="text" fontSize={16}>
          {name}
        </Typography>
        <Typography maxWidth={[200, 250]} color="text1" opacity={0.75}>
          {address ? shortenAddress(address) : description}
        </Typography>
      </Box>
      <Box ml={['55px', 'auto']} pt={['5px', 0]}>
        {address ? (
          <Flex>
            <UnderlineText onClick={connect}>
              <Typography color="primaryBright">Change</Typography>
            </UnderlineText>
            <Typography fontSize="18px" lineHeight={1} mx="1px">
              |
            </Typography>
            <UnderlineText onClick={disconnect}>
              <Typography color="primaryBright">Disconnect</Typography>
            </UnderlineText>
          </Flex>
        ) : (
          <UnderlineText onClick={connect}>
            <Typography color="primaryBright">Connect wallet</Typography>
          </UnderlineText>
        )}
      </Box>
    </Flex>
  );
};

export default WalletItem;
