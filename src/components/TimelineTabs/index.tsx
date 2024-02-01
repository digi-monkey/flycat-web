import * as Tabs from '@radix-ui/react-tabs';
import Icon from 'components/Icon';
import { Timeline } from 'components/Timeline';
import { TimelineFilterOption } from 'core/timeline-filter';
import { PublicKey } from 'core/nostr/type';
import { CallWorker } from 'core/worker/caller';
import { useRouter } from 'next/router';
import { useState } from 'react';

export interface TimelineTabsProp {
  filterOptions: TimelineFilterOption[];
  worker: CallWorker | undefined;
  defaultActiveKey?: string;
  onActiveKeyChanged?: (val: string) => any;
  showDescription?: boolean;
  editOptUrl?: string;
  visitingUser?: PublicKey;
}

export function TimelineTabs({
  filterOptions,
  worker,
  defaultActiveKey,
  onActiveKeyChanged,
  showDescription = false,
  editOptUrl,
  visitingUser,
}: TimelineTabsProp) {
  const router = useRouter();

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
              className="font-bold font-noto text-sm w-full cursor-pointer py-4 px-2 text-gray-600 whitespace-nowrap border-transparent bg-transparent border-0 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-500"
              key={val.key}
              value={val.key}
            >
              {val.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {editOptUrl && (
          <Icon
            onClick={() => router.push(editOptUrl)}
            type="icon-Gear"
            className="w-[24px] h-[24px] cursor-pointer m-auto"
          />
        )}
      </div>
      <div className="px-2">
        {filterOptions.map(val => (
          <Tabs.Content key={val.key} value={val.key}>
            {showDescription && (
              <div className="mt-2 text-xs text-text-secondary border border-solid border-brand capitalize px-1 py-1 rounded-lg bg-primary-100">
                {val.description}
              </div>
            )}
            <Timeline
              worker={worker}
              msgFilter={val}
              visitingUser={visitingUser}
            />
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  );
}
