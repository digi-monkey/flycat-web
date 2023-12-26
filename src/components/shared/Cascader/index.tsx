import * as Popover from '@radix-ui/react-popover';
import { flatten, groupBy } from 'lodash-es';
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ICascaderOption } from './type';
import { CascaderOption } from './option';
import { cn } from 'utils/classnames';

export type CascaderProps = PropsWithChildren<{
  options: ICascaderOption[][];
  defaultValue?: string[];
  value?: string[];
  onChange?(value: string[], options: ICascaderOption[]): void;
  displayRender?: (
    label: string[],
    selectedOptions?: ICascaderOption[],
  ) => React.ReactNode;
  groupLabel?: (group: string) => React.ReactNode | string;
}>;

const defaultDisplayRender = (label: string[]) => label.join(' / ');

export function Cascader(props: CascaderProps) {
  const { options, onChange } = props;
  const [optionValues, setOptionValues] = useState(
    props.value ?? props.defaultValue ?? [],
  );
  const [opened, setOpened] = useState(false);
  const displayRender = useMemo(
    () => props.displayRender ?? defaultDisplayRender,
    [props.displayRender],
  );

  useEffect(() => {
    if (props.value) {
      setOptionValues(props.value);
    }
  }, [props.value]);

  const flattenOptions = useMemo(() => flatten(options), [options]);

  const selectedOptions = useMemo(() => {
    const selectedOptions: ICascaderOption[] = [];
    let cursor = flattenOptions;
    for (const value of optionValues) {
      const option = cursor.find(option => option.value === value);
      if (!option) {
        break;
      }
      selectedOptions.push(option);
      cursor = option.children ?? [];
    }
    return selectedOptions;
  }, [flattenOptions, optionValues]);

  const handleClick = useCallback(
    (value: string[]) => {
      setOpened(false);
      const options = flattenOptions.filter(option => {
        return value.includes(option.value);
      });
      setOptionValues(value);
      onChange?.(value, options);
    },
    [flattenOptions, onChange],
  );

  return (
    <Popover.Root open={opened} onOpenChange={setOpened}>
      <Popover.Trigger asChild>
        <div className="h-10 w-full border border-solid border-gray-200 hover:border-brand rounded-lg overflow-hidden cursor-pointer select-none transition-colors">
          <div
            className={cn(
              'h-full w-full py-2 px-3 flex items-center bg-surface-02 box-border',
              {
                'opacity-70': opened,
              },
            )}
          >
            {displayRender(optionValues, selectedOptions)}
          </div>
        </div>
      </Popover.Trigger>
      <Popover.Content
        className="w-[var(--radix-popover-trigger-width)] rounded-lg overflow-hidden bg-surface-02 outline-none shadow relative z-50"
        sideOffset={5}
      >
        {options.map((opts, index) => {
          const groups = groupBy(opts, 'group');
          return Object.entries(groups).map(([group, options]) => (
            <div
              key={group}
              className={cn({
                'border-0 border-t border-solid border-gray-200': index > 0,
              })}
            >
              {group !== 'undefined' && (
                <div className="py-2 px-3">
                  <span className="text-text-secondary font-noto font-medium text-xs leading-4">
                    {props.groupLabel?.(group) ?? group}
                  </span>
                </div>
              )}
              <div className="flex flex-col">
                {options.map(option => (
                  <CascaderOption
                    key={option.value}
                    option={option}
                    value={optionValues}
                    onClick={handleClick}
                  />
                ))}
              </div>
            </div>
          ));
        })}
      </Popover.Content>
    </Popover.Root>
  );
}
