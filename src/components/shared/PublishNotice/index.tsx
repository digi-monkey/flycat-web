import * as Collapsible from '@radix-ui/react-collapsible';
import { useState } from 'react';
import { FaChevronUp, FaChevronDown, FaCircleCheck } from 'react-icons/fa6';
import { ToastClose } from '../ui/Toast';

export interface PublishNoticeProp {
  success: Array<string>;
  fail: Array<{ relay: string; reason: string }>;
}

export const PublishNotice: React.FC<PublishNoticeProp> = ({
  success,
  fail,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="w-full">
      <div className="text-sm flex align-middle justify-between items-center">
        <div className="flex items-center align-middle gap-2">
          <FaCircleCheck className="w-4 h-4 text-functional-success" />
          <div className="">
            <div className="text-neutral-900 font-bold">
              {`Publish note to ${success.length + fail.length} relays`}
            </div>
            <div className="text-xs mt-1">
              <span className="text-neutral-500">
                <span>Relay detail： </span>
                {success.length > 0 && (
                  <span className="text-primary-600">
                    {success.length} Success
                  </span>
                )}{' '}
                {fail.length > 0 && (
                  <span className="text-red-500">{fail.length} Failed</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex align-middle items-center gap-6">
          <Collapsible.Trigger asChild>
            {open ? <FaChevronUp /> : <FaChevronDown />}
          </Collapsible.Trigger>

          <ToastClose />
        </div>
      </div>

      <Collapsible.Content>
        <div className="bg-primary-100 mt-4 px-1 py-1 border-r-2">
          {success.map(r => (
            <div key={r} className="flex justify-between">
              <span className="text-neutral-900">{r}</span>
              <span className="flex items-center justify-between gap-2 text-primary-600">
                <FaCircleCheck /> <span>Success</span>
              </span>
            </div>
          ))}

          <hr className="border border-primary-100" />

          {fail.map(r => (
            <div key={r.relay} className="text-red-500 flex gap-2">
              <span className="">{r.relay}</span>
              <span className="">{r.reason}</span>
            </div>
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};
