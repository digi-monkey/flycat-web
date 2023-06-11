import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Relay } from 'service/relay/type';
import { Nip11 } from 'service/nip/11';
import { isRelayOutdate } from 'service/relay/util';
import { SingleItemAction } from '../Action/singleItem';

export type RelayTableItem = Relay & { key: string };

export interface RelayGroupTableProp {
  groupId: string;
  relays: Relay[];
}

const RelayGroupTable: React.FC<RelayGroupTableProp> = ({groupId, relays }) => {
  const [data, setData] = useState<RelayTableItem[]>([]);
  const [selectRelays, setSelectRelays] = useState<Relay[]>([]);

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
    setData(
      newRelays.map(r => {
        return { ...r, ...{ key: r.url } };
      }),
    );
  };

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
      render: (_, record) => <SingleItemAction groupId={groupId} relay={record} />,
    },
  ];

  return (
    <Table<RelayTableItem>
      rowSelection={{
        type: 'checkbox',
        onChange: (selectedRowKeys, selectedRows) => {
          console.log('Selected Row Keys:', selectedRowKeys);
          console.log('Selected Rows:', selectedRows);
          setSelectRelays(selectedRows);
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
