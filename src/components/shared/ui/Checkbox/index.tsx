import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { FiCheck, FiMinus } from 'react-icons/fi';
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
      <RadixCheckbox.Indicator>
        {checked === 'indeterminate' ? (
          <FiMinus className="w-4 h-4 selected:text-white" />
        ) : (
          <FiCheck className="w-4 h-4 selected:text-white" />
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}
