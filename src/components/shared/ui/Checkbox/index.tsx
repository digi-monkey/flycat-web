import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { FaCheck, FaMinus } from 'react-icons/fa6';
import { cn } from 'utils/classnames';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function MyCheckbox(props: CheckboxProps) {
  const { checked, onCheckedChange, disabled, className } = props;
  return (
    <RadixCheckbox.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'p-0 w-[18px] h-[18px] border-border-02 border-solid border rounded-[2px]',
        {
          'selected bg-brand border-brand': checked,
          'bg-neutral-100': !checked,
          'bg-neutral-200': disabled,
        },
        className,
      )}
    >
      <RadixCheckbox.Indicator className="flex justify-center items-center">
        {checked === 'indeterminate' ? (
          <FaMinus className="w-3 h-3 selected:text-white" />
        ) : (
          <FaCheck className="w-3 h-3 selected:text-white" />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
