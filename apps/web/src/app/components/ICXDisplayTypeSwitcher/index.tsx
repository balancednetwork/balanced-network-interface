import React from 'react';

import { Trans } from '@lingui/macro';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Typography } from '@/app/theme';
import QuestionIcon from '@/assets/icons/question.svg';
import { useCollateralChangeIcxDisplayType, useCollateralType, useIcxDisplayType } from '@/store/collateral/hooks';
import { IcxDisplayType } from '@/types';

import { LineBreak } from '../Divider';
import { MouseoverTooltip } from '../Tooltip';

const CollateralTypeButton = styled.div`
  border-radius: 100px;
  padding: 1px 12px;
  margin-right: 5px;
  color: #ffffff;
  font-size: 14px;
  background-color: #144a68;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:not(.active):hover {
    background-color: #087083;
  }

  &.active {
    cursor: default;
    background-color: #2ca9b7;
  }
`;

const ICXDisplayTypeSwitcher = ({ handleCancelAdjusting }: { handleCancelAdjusting: () => void }) => {
  const icxDisplayType = useIcxDisplayType();
  const collateralType = useCollateralType();
  const collateralChangeIcxDisplayType = useCollateralChangeIcxDisplayType();
  const smallSp = useMedia('(max-width: 360px)');

  const handleChangeIcxDisplayType = (type: IcxDisplayType) => {
    collateralChangeIcxDisplayType(type);
    handleCancelAdjusting();
  };

  return collateralType === 'sICX' ? (
    <Flex>
      <CollateralTypeButton
        className={icxDisplayType === 'ICX' ? `active` : ''}
        onClick={() => handleChangeIcxDisplayType('ICX')}
      >
        {`ICX`}
      </CollateralTypeButton>
      <CollateralTypeButton
        className={icxDisplayType === 'sICX' ? `active` : ''}
        onClick={() => handleChangeIcxDisplayType('sICX')}
      >
        {`sICX`}
      </CollateralTypeButton>
      <MouseoverTooltip
        text={
          <Box>
            <Typography>
              <Trans>View and manage your collateral as ICX or sICX (Staked ICX).</Trans>
              <LineBreak />
              <Trans>
                The ICX/sICX Deposited value is the same. The Wallet value is your available balance for that asset.
              </Trans>
            </Typography>
          </Box>
        }
        placement="top"
      >
        {!smallSp && <QuestionIcon width={14} color="text1" style={{ marginTop: 4, color: '#D5D7DB' }} />}
      </MouseoverTooltip>
    </Flex>
  ) : null;
};

export default ICXDisplayTypeSwitcher;
