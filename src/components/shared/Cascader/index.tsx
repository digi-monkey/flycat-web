import * as Popover from '@radix-ui/react-popover';
import { groupBy } from 'lodash-es';
import { PropsWithChildren, useMemo, useState } from 'react';
import { Option } from './types';
import { CascaderOption } from './option';

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
  const [opened, setOpened] = useState(false);
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

  const optionsGroup = useMemo(() => groupBy(options, 'group'), [options]);

  const handleClick = (value: string[]) => {
    setActiveValue(value);
    setOpened(false);
  };

  return (
    <Popover.Root open={opened} onOpenChange={setOpened}>
      <Popover.Trigger asChild>
        <div className="h-10 w-full border border-gray-200 hover:border-brand rounded-lg cursor-pointer select-none transition-colors">
          <div className="h-full w-full py-2 px-3 flex items-center">
            {displayRender(activeValue, selectedOptions)}
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content
        className="w-[var(--radix-popover-trigger-width)] rounded-lg overflow-hidden bg-surface-02 outline-none shadow"
        sideOffset={5}
      >
        {Object.entries(optionsGroup).map(([group, options]) => (
          <div key={group}>
            <div className="py-2 px-3">
              <span className="text-text-secondary font-noto font-medium text-xs leading-4">
                {group}
              </span>
            </div>
            <div className="flex flex-col">
              {options.map(option => (
                <CascaderOption
                  key={option.value}
                  option={option}
                  value={activeValue}
                  onClick={handleClick}
                />
              ))}
            </div>
          </div>
        ))}
      </Popover.Content>
    </Popover.Root>
  );
}
