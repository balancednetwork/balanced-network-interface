import React from 'react';

import { t } from '@lingui/macro';
import { Box, Flex } from 'rebass';
import styled from 'styled-components';

import { getNetworkDisplayName } from 'app/pages/trade/bridge-v2/utils';
import { Typography } from 'app/theme';
import ArrowIcon from 'assets/icons/arrow-white.svg';

import Spinner from '../../../../components/Spinner';

const Wrap = styled(Box)`
  display: grid;
  grid-template-columns: 4fr 3fr 3fr;
  grid-gap: 15px;
  width: 100%;
  padding-bottom: 20px;

  @media (min-width: 800px) and (max-width: 1049px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (max-width: 580px) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    * {
      text-align: center;
      align-items: center !important;
    }
  }

  @media (min-width: 1050px) {
    display: grid;
    grid-template-columns: 3fr 4fr 3fr;
  }
`;

const Status = styled(Typography)`
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-left: 10px;
`;

const FailedX = styled(Box)`
  width: 10px;
  height: 15px;
  margin-right: 10px;

  :before {
    content: 'X';
    display: block;
    font-size: 16px;
    line-height: 1.03;
    color: ${({ theme }) => theme.colors.alert};
  }
`;

const BridgeTransferHistoryItem = () => {
  return (
    <Wrap>
      <Flex alignItems="center">
        {getNetworkDisplayName('archway-1')}
        <ArrowIcon width="13px" style={{ margin: '0 7px' }} />
        {getNetworkDisplayName('0x1.icon')}
      </Flex>
      <Flex justifyContent="center" flexDirection="column">
        <Typography fontWeight={700} color="text">
          {'Transfer bnUSD'}
        </Typography>
        <Typography opacity={0.75} fontSize={14}>
          {'0.3 bnUSD'}
        </Typography>
      </Flex>
      <Flex justifyContent="center" flexDirection="column" alignItems="flex-end" className="status-check">
        <>
          <Flex alignItems="center">
            <Spinner size={15} />
            <Status style={{ transform: 'translateY(1px)' }}>pending</Status>
          </Flex>
          <Typography opacity={0.75} fontSize={14}>
            10m 20s
          </Typography>
        </>
      </Flex>
    </Wrap>
  );
};

export default BridgeTransferHistoryItem;
