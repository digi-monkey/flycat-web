import React from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from 'utils/classnames';

export interface SegmentedProp {
  value: string;
  options: Array<string | { label: string; value: string }>;
  onChange: (val: string) => any;
  className?: string;
}

const Segmented: React.FC<SegmentedProp> = ({
  value,
  options,
  onChange,
  className,
}) => {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={onChange}
      className="py-0.5 px-0.5 flex rounded-lg bg-[#1e1e1e0a] items-center"
    >
      {options.map(opt => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isFocus = val === value;
        const focusClass =
          'relative text-center cursor-pointer transition-colors duration-200 ease-in-out bg-neutral-100 text-neutral-900';
        return (
          <ToggleGroup.Item
            key={val}
            className={cn(
              'text-neutral-700 py-2 px-4 rounded-lg flex items-center border-0 cursor-pointer',
              className,
              isFocus ? focusClass : '',
            )}
            value={val}
          >
            {capitalizeString(label)}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
};

export default Segmented;

function capitalizeString(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
