import React, { useCallback, useState } from 'react';
import { isIOS } from 'react-device-detect';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from '@lingui/macro';
import { shortenAddress } from '@/utils';

export function CustomTooltip({ children, content, ...props }) {
  const [show, setShow] = useState(false);
  const open = useCallback(() => setShow(true), []);
  const close = useCallback(() => setShow(false), []);

  return (
    <TooltipProvider>
      <Tooltip open={show}>
        <TooltipTrigger asChild>
          <div onClick={open} {...(!isIOS ? { onMouseEnter: open } : null)} onMouseLeave={close}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" {...props} className="p-0 bg-transparent">
          <div className="relative z-[100] bg-background text-white py-1 px-2">{content}</div>
          <TooltipPrimitive.Arrow width={11} height={5} asChild>
            <div className="relative z-[99] w-[10px] h-[10px] mt-[-6px] transform rotate-45 border-[1px] bg-background"></div>
          </TooltipPrimitive.Arrow>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const CopyableAddress = ({ account }: { account: string | null | undefined }) => {
  const [isCopied, updateCopyState] = React.useState(false);
  const copyAddress = React.useCallback(async (account: string) => {
    await navigator.clipboard.writeText(account);
    updateCopyState(true);
  }, []);

  return account ? (
    <CustomTooltip content={isCopied ? t`Copied` : t`Copy`}>
      <span
        className="text-[#0d0229] cursor-pointer flex text-body font-[500]"
        onMouseLeave={() => {
          setTimeout(() => updateCopyState(false), 250);
        }}
        onClick={() => copyAddress(account)}
      >
        {shortenAddress(account, 4)}
      </span>
    </CustomTooltip>
  ) : null;
};

export default CopyableAddress;
