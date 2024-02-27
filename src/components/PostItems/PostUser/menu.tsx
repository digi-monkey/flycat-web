import Icon from 'components/Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/shared/ui/DropdownMenu';
import { useToast } from 'components/shared/ui/Toast/use-toast';

export function PostUserMenu({ event, publicKey, extraMenu }) {
  const { toast } = useToast();
  const items = [
    {
      label: 'copy share link',
      key: 'copy-share-link',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          const shareLink = `${window.location.origin}/event/${event.id}`;
          await copyToClipboard(shareLink);
          toast({
            title: 'Link copy! paste to web2 platform to share nostr contents!',
            status: 'success',
          });
        } catch (error: any) {
          toast({
            title: `share link copy failed! ${error.message}`,
            status: 'error',
          });
        }
      },
    },
    {
      label: 'copy note id',
      key: '0',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          const { Nip19, Nip19DataType } = await import('core/nip/19');
          await copyToClipboard(Nip19.encode(event.id, Nip19DataType.EventId));
          toast({
            title: 'note id copy to clipboard!',
            status: 'success',
          });
        } catch (error: any) {
          toast({
            title: `share link copy failed! ${error.message}`,
            status: 'error',
          });
        }
      },
    },
    {
      label: 'copy note JSON ',
      key: '1',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          await copyToClipboard(JSON.stringify(event));
          toast({
            title: 'note JSON copy to clipboard!',
            status: 'success',
          });
        } catch (error: any) {
          toast({
            title: `note JSON copy failed! ${error.message}`,
            status: 'error',
          });
        }
      },
    },
    {
      label: 'copy user public key',
      key: '2',
      onClick: async () => {
        try {
          const { copyToClipboard } = await import('utils/common');
          await copyToClipboard(publicKey);
          toast({
            title: 'public key copy to clipboard!',
            status: 'success',
          });
        } catch (error: any) {
          toast({
            title: `public key copy failed! ${error.message}`,
            status: 'error',
          });
        }
      },
    },
    {
      type: 'divider',
    },
    {
      label: 'relay',
      key: '3',
      onClick: () => {
        alert(`event seen on relays: ${JSON.stringify(event.seen, null, 2)}`);
      },
      // todo: use modal
    },
  ];

  if (extraMenu) {
    for (const option of extraMenu) {
      items.push({
        label: option.label,
        key: (items.length + 1).toString(),
        onClick: () => {
          option.onClick(event);
        },
      });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-auto p-0 m-0">
        <Icon
          type="icon-more-vertical"
          className="w-5 h-5 fill-neutral-600 cursor-pointer block"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map(item => {
          if (item.type === 'divider') {
            return <hr key={item.key} className="border-neutral-300" />;
          }

          return (
            <DropdownMenuItem
              key={item.key}
              onClick={item.onClick}
              className="text-neutral-800"
            >
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
