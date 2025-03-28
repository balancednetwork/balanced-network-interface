import { UnderlineTextWithArrow } from '@/app/components/DropdownText';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import { MMTrade, useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { Trans } from '@lingui/macro';
import React, { memo } from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import MMAdvancedSwapDetails from './MMAdvancedSwapDetails';

interface SwapInfoProps {
  trade: MMTrade | undefined;
}

const MMSwapInfo: React.FC<SwapInfoProps> = ({ trade }) => {
  const { currencies } = useDerivedSwapInfo();

  const minimumToReceive = trade?.outputAmount;

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const arrowRef = React.useRef(null);

  const closeDropdown = () => {
    setAnchor(null);
  };

  const ToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(anchor ? null : arrowRef.current);
  };

  return (
    <Flex alignItems="center" justifyContent="space-between">
      <Typography>
        <Trans>Minimum to receive</Trans>
      </Typography>

      <ClickAwayListener onClickAway={closeDropdown}>
        <div>
          <UnderlineTextWithArrow
            onClick={ToggleDropdown}
            text={
              minimumToReceive
                ? `${minimumToReceive?.toFixed(4, { groupSeparator: ',' })} ${minimumToReceive?.currency.symbol}`
                : `0 ${currencies[Field.OUTPUT]?.symbol}`
            }
            arrowRef={arrowRef}
          />

          <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
            <MMAdvancedSwapDetails />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};

export default memo(MMSwapInfo);
