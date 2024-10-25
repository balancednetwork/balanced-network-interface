import React from 'react';

import { t } from '@lingui/macro';
import { Placement } from '@popperjs/core';

import { MouseoverTooltip } from '@/app/components/Tooltip';
import { shortenAddress } from '@/utils';

const CopyableAddress = ({
  account,
  closeAfterDelay,
  placement = 'left',
}: {
  account: string | null | undefined;
  closeAfterDelay?: number;
  copyIcon?: boolean;
  placement?: Placement;
}) => {
  const [isCopied, updateCopyState] = React.useState(false);
  const copyAddress = React.useCallback(async (account: string) => {
    await navigator.clipboard.writeText(account);
    updateCopyState(true);
  }, []);

  return account ? (
    <MouseoverTooltip
      content={isCopied ? t`Copied` : t`Copy`}
      placement={placement}
      closeAfterDelay={closeAfterDelay}
      zIndex={9999}
    >
      <span
        className="text-light-purple cursor-pointer flex text-body font-[500]"
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(account)}
      >
        {shortenAddress(account, 4)}
      </span>
    </MouseoverTooltip>
  ) : null;
};

export default CopyableAddress;
