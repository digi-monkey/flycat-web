import React from 'react';
import * as PrimitiveTooltip from '@radix-ui/react-tooltip';
import { Side } from '@radix-ui/react-popper';
import { capitalizeString } from 'utils/str';

export interface TooltipProp {
  children: React.ReactNode;
  title: string;
  placement?: Side;
}

const Tooltip: React.FC<TooltipProp> = ({ children, title, placement }) => {
  return (
    <PrimitiveTooltip.Provider>
      <PrimitiveTooltip.Root>
        <PrimitiveTooltip.Trigger asChild>{children}</PrimitiveTooltip.Trigger>
        <PrimitiveTooltip.Portal>
          <PrimitiveTooltip.Content
            side={placement || 'bottom'}
            className="bg-neutral-900 px-4 py-2 rounded-lg text-neutral-50 text-sm font-poppins"
            sideOffset={5}
          >
            {capitalizeString(title)}
            <PrimitiveTooltip.Arrow className="fill-black" />
          </PrimitiveTooltip.Content>
        </PrimitiveTooltip.Portal>
      </PrimitiveTooltip.Root>
    </PrimitiveTooltip.Provider>
  );
};

export default Tooltip;
