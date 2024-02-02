import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/shared/ui/Table';
import { Relay } from 'core/relay/type';
import { FaCircle, FaEllipsis } from 'react-icons/fa6';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CopyToGroupModal, { CopyToGroupModalRef } from '../CopyToGroupModal';
import { useRelaysQuery } from 'hooks/relay/useRelaysQuery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'components/shared/ui/DropdownMenu';

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
  const copyModalRef = useRef<CopyToGroupModalRef>(null);
  const moveModalRef = useRef<CopyToGroupModalRef>(null);

  const handleRemoveRelay = useCallback(
    async (relays: Relay[]) => {
      await removeMutation.mutateAsync(relays);
      toast({
        status: 'success',
        title: `Successfully removed ${relays.length} relays`,
      });
    },
    [removeMutation, toast],
  );

  const handleCopyRelays = useCallback(
    async (groupIds: string[], relays: Relay[]) => {
      await copyMutation.mutateAsync({
        groupIds,
        relays,
      });
      toast({
        status: 'success',
        title: `Successfully copied ${relays.length} relays to groups`,
      });
    },
    [toast, copyMutation],
  );

  const handleMoveRelays = useCallback(
    async (groupIds: string[], relays: Relay[]) => {
      await removeMutation.mutateAsync(relays);
      await copyMutation.mutateAsync({
        groupIds,
        relays,
      });
      toast({
        status: 'success',
        title: `Successfully moved ${relays.length} relays to groups`,
      });
    },
    [copyMutation, removeMutation, toast],
  );

  const actionsColumn: ColumnDef<Relay> = useMemo(
    () => ({
      id: 'actions',
      cell: ({ row, table }) => {
        const relay = row.original;
        return (
          <div className="h-full flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <FaEllipsis className="w-4 h-4 text-text-secondary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    table.resetRowSelection();
                    row.toggleSelected();
                    setTimeout(() => {
                      copyModalRef.current?.open();
                    });
                  }}
                >
                  Copy to
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    table.resetRowSelection();
                    row.toggleSelected();
                    setTimeout(() => {
                      moveModalRef.current?.open();
                    });
                  }}
                >
                  Move to
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleRemoveRelay([relay]);
                  }}
                >
                  Remove from group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
    [handleRemoveRelay],
  );

  const table = useReactTable({
    data: relays,
    columns: [...columns, actionsColumn],
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
    <div className="relative flex flex-col justify-between">
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
                  await handleRemoveRelay(selectedRelays);
                  table.resetRowSelection();
                }}
              >
                {removeConfirm ? 'Confirm?' : 'Remove'}
              </Button>
              <CopyToGroupModal
                ref={copyModalRef}
                currentGroupId={groupId}
                relays={selectedRelays}
                onConfirm={async (groupIds: string[]) => {
                  await handleCopyRelays(groupIds, selectedRelays);
                  table.resetRowSelection();
                }}
              >
                <Button variant="link" className="px-2">
                  Copy to
                </Button>
              </CopyToGroupModal>
              <CopyToGroupModal
                ref={moveModalRef}
                currentGroupId={groupId}
                relays={selectedRelays}
                duplicate={false}
                onConfirm={async (groupIds: string[]) => {
                  await handleMoveRelays(groupIds, selectedRelays);
                  table.resetRowSelection();
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
