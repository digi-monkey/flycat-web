import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/shared/ui/Table';
import { Relay } from 'core/relay/type';
import { FaCircle } from 'react-icons/fa6';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import Checkbox from 'components/shared/ui/Checkbox';
import { cn } from 'utils/classnames';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Button } from 'components/shared/ui/Button';
import useRemoveRelayMutation from 'pages/relay-manager/hooks/useRemoveRelayMutation';
import useCopyRelaysMutation from 'pages/relay-manager/hooks/useCopyRelaysMutation';
import { useToast } from 'components/shared/ui/Toast/use-toast';
import { useEffect, useState } from 'react';
import CopyToGroupModal from '../CopyToGroupModal';
import { useRelaysQuery } from 'hooks/relay/useRelaysQuery';

interface RelayTableProps {
  groupId: string;
}

export const columns: ColumnDef<Relay>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="h-full flex items-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="h-full flex items-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={value => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
  },
  {
    accessorKey: 'accessType',
    header: 'Type',
    cell: ({ row }) => {
      const accessType = row.getValue('accessType');
      return accessType ?? 'Unknown';
    },
  },
  {
    accessorKey: 'url',
    header: 'URL',
    cell: ({ row }) => {
      const url = row.getValue('url') as string;
      return <span className="text-text-link no-underline">{url}</span>;
    },
  },
  {
    accessorKey: 'isOnline',
    header: 'Status',
    cell: ({ row }) => {
      const isOnline = row.getValue('isOnline') as boolean;
      return (
        <div className="flex items-center gap-2">
          <FaCircle
            className={cn('w-2 h-2', {
              'text-brand': isOnline,
              'text-functional-danger': !isOnline,
            })}
          />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      );
    },
  },
];

export default function RelayTable(props: RelayTableProps) {
  const { groupId } = props;
  const myPublicKey = useReadonlyMyPublicKey();
  const { data: relays = [] } = useRelaysQuery(myPublicKey, groupId);
  const { toast } = useToast();
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const removeMutation = useRemoveRelayMutation(groupId);
  const copyMutation = useCopyRelaysMutation(groupId);

  const table = useReactTable({
    data: relays,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRelays = table
    .getSelectedRowModel()
    .rows.map(row => row.original);

  useEffect(() => {
    if (selectedRelays.length === 0) {
      setRemoveConfirm(false);
    }
  }, [selectedRelays.length]);

  return (
    <div className="h-[calc(100%-38px)] relative flex flex-col justify-between">
      <div className="px-4">
        <Table className="border-collapse indent-0">
          <TableHeader className="border-border-01">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                className={cn({
                  'bg-conditional-selected01': table.getIsAllPageRowsSelected(),
                })}
              >
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  style={{ borderBottom: '' }}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'border-0 border-b border-solid border-border-01',
                    {
                      'bg-conditional-selected01': row.getIsSelected(),
                    },
                  )}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No relays.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="sticky bottom-0 h-12 w-full px-5 py-3 bg-surface-02 border-0 border-t border-solid border-border-01 box-border">
          <div className="w-full h-full flex justify-between items-center">
            <span>{table.getSelectedRowModel().rows.length} selected</span>
            <div className="flex items-center gap-4">
              <Button
                variant="link"
                className={cn(
                  'text-functional-danger hover:text-functional-danger/80 px-2',
                  {
                    'text-white bg-functional-danger hover:text-white':
                      removeConfirm,
                  },
                )}
                onClick={async () => {
                  if (!removeConfirm) {
                    setRemoveConfirm(true);
                    setTimeout(() => {
                      setRemoveConfirm(false);
                    }, 3000);
                    return;
                  }
                  await removeMutation.mutateAsync(selectedRelays);
                  table.resetRowSelection();
                  toast({
                    status: 'success',
                    title: `Successfully removed ${selectedRelays.length} relays`,
                  });
                }}
              >
                {removeConfirm ? 'Confirm?' : 'Remove'}
              </Button>
              <CopyToGroupModal
                currentGroupId={groupId}
                relays={selectedRelays}
                onConfirm={async (groupIds: string[]) => {
                  await copyMutation.mutateAsync({
                    groupIds,
                    relays: selectedRelays,
                  });
                  table.resetRowSelection();
                  toast({
                    status: 'success',
                    title: `Successfully copied ${selectedRelays.length} relays to groups`,
                  });
                }}
              >
                <Button variant="link" className="px-2">
                  Copy to
                </Button>
              </CopyToGroupModal>
              <CopyToGroupModal
                currentGroupId={groupId}
                relays={selectedRelays}
                duplicate={false}
                onConfirm={async (groupIds: string[]) => {
                  await removeMutation.mutateAsync(selectedRelays);
                  await copyMutation.mutateAsync({
                    groupIds,
                    relays: selectedRelays,
                  });
                  table.resetRowSelection();
                  toast({
                    status: 'success',
                    title: `Successfully moved ${selectedRelays.length} relays to groups`,
                  });
                }}
              >
                <Button variant="link" className="px-2">
                  Move to
                </Button>
              </CopyToGroupModal>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
