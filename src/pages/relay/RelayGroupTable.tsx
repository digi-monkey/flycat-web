import React, { useEffect, useState } from 'react';
import { Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Relay } from 'service/relay/type';
import { RelayAccessType } from 'service/relay/type';
import { EllipsisOutlined } from '@ant-design/icons';

export type RelayTableItem = Relay & { key: string };

const columns: ColumnsType<RelayTableItem> = [
  {
    title: 'Type',
    dataIndex: 'accessType',
    key: 'accessType',
  },
  {
    title: 'URL',
    dataIndex: 'url',
    key: 'url',
  },
  {
    title: 'Status',
    dataIndex: 'isOnline',
    key: 'isOnline',
    render: (isOnline: boolean) => (isOnline ? 'Online' : 'Offline'),
  },
  {
    key: 'action',
    render: (_, record) => (
      <EllipsisOutlined
        onClick={() => {
          console.log('click', record);
        }}
        style={{ cursor: 'pointer' }}
      />
    ),
  },
];

export interface RelayGroupTableProp {
  relays: Relay[];
}
const RelayGroupTable: React.FC<RelayGroupTableProp> = ({ relays }) => {
  const [data, setData] = useState<RelayTableItem[]>([]);

  useEffect(() => {
    setData(
      relays.map(r => {
        return { ...r, ...{ key: r.url } };
      }),
    );
  }, [relays]);

  return (
    <Table<RelayTableItem>
      rowSelection={{
        type: 'checkbox',
        onChange: (selectedRowKeys, selectedRows) => {
          console.log('Selected Row Keys:', selectedRowKeys);
          console.log('Selected Rows:', selectedRows);
        },
        // You can customize other selection properties here if needed
      }}
      columns={columns}
      dataSource={data}
    />
  );
};

export default RelayGroupTable;
