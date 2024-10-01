import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import React from 'react';

export default function TooltipContainer({ tooltipText, children }) {
  return (
    <HoverCard>
      <HoverCardTrigger>{children}</HoverCardTrigger>
      <HoverCardContent side="right">
        <p className="w-[200px]">{tooltipText}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

// export default function TooltipContainer({ tooltipText, children }) {
//   return (
//     <TooltipProvider delayDuration={300}>
//       <Tooltip>
//         <TooltipTrigger>{children}</TooltipTrigger>
//         <TooltipContent side="right" sideOffset={5} align="start" avoidCollisions={true} collisionPadding={1}>
//           <p className="w-[200px]">{tooltipText}</p>
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   );
// }
