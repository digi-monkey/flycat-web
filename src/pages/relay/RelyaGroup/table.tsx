import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Relay } from 'service/relay/type';
import { EllipsisOutlined } from '@ant-design/icons';
import { Nip11 } from 'service/nip/11';
import { isRelayOutdate } from 'service/relay/util';

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
    updateRelayData(relays); 
  }, [relays]);

  const updateRelayData = async (relays: Relay[]) => {
    const details = await Nip11.getRelays(
      relays.filter(r => isRelayOutdate(r)).map(r => r.url),
    );
    const newRelays = relays.map(r => {
      if (details.map(d => d.url).includes(r.url)) {
        return details.filter(d => d.url === r.url)[0]!;
      } else {
        return r;
      }
    });

    // todo: save relay update value

    setData(newRelays.map(r => {
      return { ...r, ...{ key: r.url } };
    }));
  };

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
      pagination={false}
    />
  );
};

export default RelayGroupTable;
