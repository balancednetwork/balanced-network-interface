import { UnderlineTextWithArrow } from '@/app/components/DropdownText';
import { DropdownPopper } from '@/app/components/Popover';
import { Typography } from '@/app/theme';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { useDerivedSwapInfo } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatSymbol } from '@/utils/formatter';
import { Currency, Percent, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import React from 'react';
import ClickAwayListener from 'react-click-away-listener';
import { Flex } from 'rebass/styled-components';
import AdvancedSwapDetails from './AdvancedSwapDetails';

interface SwapInfoProps {
  trade: Trade<Currency, Currency, TradeType> | undefined;
}

const SwapInfo: React.FC<SwapInfoProps> = ({ trade }) => {
  const { currencies } = useDerivedSwapInfo();

  const slippageTolerance = useSwapSlippageTolerance();

  const minimumToReceive = trade?.minimumAmountOut(new Percent(slippageTolerance, 10_000));

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
                ? `${minimumToReceive?.toFixed(4)} ${formatSymbol(minimumToReceive?.currency.symbol)}`
                : `0 ${formatSymbol(currencies[Field.OUTPUT]?.symbol)}`
            }
            arrowRef={arrowRef}
          />

          <DropdownPopper show={Boolean(anchor)} anchorEl={anchor} placement="bottom-end">
            <AdvancedSwapDetails />
          </DropdownPopper>
        </div>
      </ClickAwayListener>
    </Flex>
  );
};

export default SwapInfo;
