import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { cn } from 'utils/classnames';
import PubNoteTextarea from 'components/PubNoteTextarea';

type AddNoteDialogProps = {
  children: React.ReactNode;
};

const AddNoteDialog = (props: AddNoteDialogProps) => {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);

  return (
    <Dialog.Root open={opened} onOpenChange={setOpened}>
      <Dialog.Trigger asChild>{props.children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overflay-01 animate-overlay-show z-40" />
        <Dialog.Content
          className={cn(
            'fixed w-[90vw] sm:w-auto sm:min-w-[630px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'py-4 bg-surface-03 rounded-lg shadow-sm z-50',
            'animate-content-show',
          )}
        >
          <div className="flex flex-col px-6 gap-3 mb-3">
            <Dialog.Title className="my-0 subheader01-bold text-text-primary">
              {t('baseLayout.modal.title')}
            </Dialog.Title>
            <Dialog.Description className="label text-text-secondary my-0">
              {t('baseLayout.modal.desc')}
            </Dialog.Description>
          </div>
          <PubNoteTextarea pubSuccessCallback={() => setOpened(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AddNoteDialog;
