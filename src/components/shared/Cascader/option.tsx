import { ICascaderOption } from './types';
import { FiCheck } from 'react-icons/fi';
import { FiChevronRight } from 'react-icons/fi';
import * as HoverCard from '@radix-ui/react-hover-card';
import classnames from 'classnames';

export type CascaderOptionProps = {
  option: ICascaderOption;
  value: string[];
  path?: string[];
  onClick(value: string[]): void;
};

export function CascaderOption(props: CascaderOptionProps) {
  const { option, value, path = [], onClick } = props;
  const isLeaf = !option.children || option.children.length === 0;
  const isActive = value[path.length] === option.value;

  const handleClick = () => {
    if (!isLeaf || option.disabled) {
      return;
    }
    onClick([...path, option.value]);
  };

  return (
    <HoverCard.Root openDelay={200} closeDelay={200}>
      <HoverCard.Trigger asChild>
        <div
          className={classnames(
            'min-w-[320px] py-2 px-1 flex justify-between select-none',
            {
              'bg-conditional-selected01': isActive,
              'cursor-pointer': !option.disabled,
              'cursor-not-allowed': option.disabled,
            },
            'hover:bg-conditional-hover01',
          )}
          onClick={handleClick}
        >
          <div className="flex items-center gap-1">
            <FiCheck
              className={classnames('text-text-primary w-4 h-4 opacity-0', {
                'opacity-100': isActive,
              })}
            />
            <span
              className={classnames('font-noto text-text-primary text-sm', {
                'text-text-secondary': option.disabled,
              })}
            >
              {option.label ?? option.value}
            </span>
          </div>
          {!isLeaf && (
            <FiChevronRight className="text-text-secondary w-4 h-4" />
          )}
        </div>
      </HoverCard.Trigger>
      {!isLeaf && (
        <HoverCard.Portal>
          <HoverCard.Content
            side="right"
            align="start"
            sideOffset={5}
            className="rounded-lg bg-surface-02 overflow-hidden outline-none shadow"
          >
            {option.children?.map(child => (
              <CascaderOption
                key={child.value}
                option={child}
                value={value}
                path={[...path, option.value]}
                onClick={onClick}
              />
            ))}
          </HoverCard.Content>
        </HoverCard.Portal>
      )}
    </HoverCard.Root>
  );
}
