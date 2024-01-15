import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import Checkbox from 'components/shared/ui/Checkbox';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from 'components/shared/ui/Table';
import { Relay } from 'core/relay/type';
import useAllRelaysQuery, {
  useGetAllRelaysCountQuery,
} from 'pages/relay-manager/hooks/useGetAllRelaysQuery';
import { FaCircle } from 'react-icons/fa6';
import { cn } from 'utils/classnames';
import { Pagination } from 'components/shared/Pagination';
import { useState } from 'react';
import { Button } from 'components/shared/ui/Button';
import { toast } from 'components/shared/ui/Toast/use-toast';
import CopyToGroupModal from '../CopyToGroupModal';
import useCopyRelaysMutation from 'pages/relay-manager/hooks/useCopyRelaysMutation';

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
  {
    id: 'supportedNips',
    header: 'NIPs',
    cell: ({ row }) => {
      const { supportedNips } = row.original;
      if (!supportedNips?.length) {
        return <span className="text-text-primary label">Unknown</span>;
      }

      return (
        <div className="flex items-center gap-1">
          {supportedNips?.slice(0, 3).map(nip => (
            <span key={nip} className="text-text-primary label">
              NIP-{nip},
            </span>
          ))}
          {supportedNips?.length > 3 && (
            <span className="text-text-primary label">...</span>
          )}
        </div>
      );
    },
  },
];

export default function RelayPool() {
  const [pageIndex, setPageIndex] = useState(1);
  const { data: relays = [] } = useAllRelaysQuery(pageIndex, 20);
  const { data: totalCount = 0 } = useGetAllRelaysCountQuery();
  const copyMutation = useCopyRelaysMutation();

  const table = useReactTable({
    data: relays,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedRelays = table
    .getSelectedRowModel()
    .rows.map(row => row.original);

  return (
    <div className="flex-1 bg-surface-02 relative px-4 flex flex-col justify-between">
      <div>
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
        <div className="flex mt-8 mb-20 justify-center">
          <Pagination
            pageIndex={pageIndex}
            pageCount={Math.ceil(totalCount / 20)}
            onPageChange={(page: number) => setPageIndex(page)}
          />
        </div>
      </div>

      {table.getSelectedRowModel().rows.length > 0 && (
        <div className="sticky bottom-0 h-12 w-full px-5 py-3 bg-surface-02 border-0 border-t border-solid border-border-01 box-border">
          <div className="w-full h-full flex justify-between items-center">
            <span>{table.getSelectedRowModel().rows.length} selected</span>
            <div className="flex items-center">
              <CopyToGroupModal
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
                <Button variant="link">Copy to</Button>
              </CopyToGroupModal>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
