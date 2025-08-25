import React from 'react';

import { Trans } from '@lingui/macro';
import { Flex } from 'rebass/styled-components';
import ClickAwayListener from 'react-click-away-listener';

import { Typography } from '@/app/theme';
import { DropdownPopper } from '@/app/components/Popover';
import { UnderlineTextWithArrow } from '@/app/components/DropdownText';
import { useDerivedTradeInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol } from '@/utils/formatter';
import { normaliseTokenAmount } from '@/lib/sodax/utils';

import AdvancedOrderDetails from './AdvancedOrderDetails';
import BigNumber from 'bignumber.js';

const OrderInfo = () => {
  const { minOutputAmount, currencies } = useDerivedTradeInfo();

  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const arrowRef = React.useRef(null);

  const closeDropdown = () => {
    setAnchor(null);
  };

  const toggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
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
            onClick={toggleDropdown}
            text={
              minOutputAmount
                ? `${new BigNumber(
                    normaliseTokenAmount(BigInt(minOutputAmount.toFixed(0)), currencies[Field.OUTPUT]?.decimals ?? 18),
                  ).toPrecision(6)} ${formatSymbol(currencies[Field.OUTPUT]?.symbol)}`
                : `0 ${formatSymbol(currencies[Field.OUTPUT]?.symbol)}`
            }
            arrowRef={arrowRef}
          />

          <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
            <AdvancedOrderDetails />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};

export default OrderInfo;
