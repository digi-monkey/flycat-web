import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/shared/ui/Table';
import { Relay } from 'core/relay/type';
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import Checkbox from 'components/shared/ui/Checkbox';
import { cn } from 'utils/classnames';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useRelaysQuery } from '../../hooks/useRelaysQuery';

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
      return accessType ?? 'Private';
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
          {isOnline ? (
            <FiCheckCircle className="text-brand" />
          ) : (
            <FiAlertCircle className="text-orange-700" />
          )}
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

  const table = useReactTable({
    data: relays,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
                  {header.isPlaceholder
                    ? null
                    : flexRender(
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
              className={cn('border-0 border-b border-solid border-border-01', {
                'bg-conditional-selected01': row.getIsSelected(),
              })}
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No relays.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
