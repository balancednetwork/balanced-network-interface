import React, { useEffect } from 'react';

import { BlueButton } from '@/app/components2/Button';
import { Trans, t } from '@lingui/macro';

export default function NewFeaturePage() {
  return (
    <div className="min-h-[600px] pt-10 pb-16 px-[60px] flex flex-col gap-4 bg-[rgba(105,86,130,0.3)] rounded-[24px] backdrop-blur-[50px] justify-center relative">
      <div className="gradient-border-mask flex flex-col gap-6 px-4 py-6 relative">
        <div className="text-[10px] font-semibold text-center text-[#695682] absolute -top-2 inset-x-0 bg-transparent px-3">
          NEW FEATURE
        </div>
        <div
          className="text-title-gradient text-[28px] font-extrabold text-center"
          style={{
            fontFamily: `"Montserrat Alternates", sans-serif`,
          }}
        >
          Follow <br />
          for launch!
        </div>
        <div className="text-sm font-medium text-center text-light-purple mb-8">
          We are working on this feature and we will make noise about it!
        </div>
      </div>
      <a href="https://x.com/hanawallet" target="_blank" rel="noreferrer">
        <BlueButton>
          <Trans>Follow us now</Trans>
        </BlueButton>
      </a>
    </div>
  );
}
