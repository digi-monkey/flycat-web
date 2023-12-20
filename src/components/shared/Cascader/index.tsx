import * as Popover from '@radix-ui/react-popover';
import { PropsWithChildren, useMemo, useState } from 'react';

interface Option {
  value: string | number;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: Option[];
}

export type CascaderProps = PropsWithChildren<{
  defaultValue?: string[];
  options: Option[];
  displayRender?: (
    label: string[],
    selectedOptions?: Option[],
  ) => React.ReactNode;
}>;

const defaultDisplayRender = (label: string[]) => label.join(' / ');

export function Cascader(props: CascaderProps) {
  const { defaultValue, options } = props;
  const [activeValue, setActiveValue] = useState<string[]>(defaultValue ?? []);
  const displayRender = useMemo(
    () => props.displayRender ?? defaultDisplayRender,
    [props.displayRender],
  );

  const selectedOptions = useMemo(() => {
    const selectedOptions: Option[] = [];
    let cursor = options;
    for (const value of activeValue) {
      const option = cursor.find(option => option.value === value);
      if (!option) {
        break;
      }
      selectedOptions.push(option);
      cursor = option.children ?? [];
    }
    return selectedOptions;
  }, [activeValue, options]);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <div>{displayRender(activeValue, selectedOptions)}</div>
      </Popover.Trigger>
      <Popover.Content>Content</Popover.Content>
    </Popover.Root>
  );
}
