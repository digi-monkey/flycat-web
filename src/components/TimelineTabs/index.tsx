import * as Tabs from '@radix-ui/react-tabs';
import { Timeline } from 'components/Timeline';
import { MsgFilter, MsgFilterKey } from 'core/msg-filter/filter';
import { CallWorker } from 'core/worker/caller';
import { useState } from 'react';

export interface TimelineTabsProp {
  filterOptions: MsgFilter[];
  worker: CallWorker | undefined;
  defaultActiveKey?: string;
  onActiveKeyChanged?: (val: string) => any;
  showDescription?: boolean;
}

export function TimelineTabs({
  filterOptions,
  worker,
  defaultActiveKey,
  onActiveKeyChanged,
  showDescription = true,
}: TimelineTabsProp) {
  const [activeTabKey, setActiveTabKey] = useState<string>(
    defaultActiveKey || filterOptions[0].key,
  );

  const onValueChange = (val: string) => {
    setActiveTabKey(val);

    if (onActiveKeyChanged) {
      onActiveKeyChanged(val);
    }
  };

  return (
    <Tabs.Root
      className="w-full"
      value={activeTabKey}
      onValueChange={onValueChange}
    >
      <div className="flex justify-center items-center px-4 sticky top-16 bg-white sm:bg-transparent bg-opacity-80 backdrop-blur z-40">
        <Tabs.List className="w-full flex justify-between overflow-scroll border-0 border-b border-solid border-b-gray-200">
          {filterOptions.map(val => (
            <Tabs.Trigger
              className="font-bold font-noto w-full cursor-pointer py-4 px-2 text-gray-600 whitespace-nowrap border-transparent bg-transparent border-0 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
              key={val.key}
              value={val.key}
            >
              {val.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </div>
      <div className="px-2">
        {filterOptions.map(val => (
          <Tabs.Content key={val.key} value={val.key}>
            {showDescription && (
              <div className="mt-2 text-xs text-text-secondary border border-solid border-brand capitalize px-1 py-1 rounded-lg bg-primary-100">
                {val.description}
              </div>
            )}
            <Timeline worker={worker} msgFilter={val} />
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}
