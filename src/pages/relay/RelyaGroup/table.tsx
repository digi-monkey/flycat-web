import { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import { Relay, RelayTracker } from 'core/relay/type';
import { Nip11 } from 'core/nip/11';
import { SingleItemAction } from '../Action/singleItem';
import { MultipleItemsAction } from '../Action/multipleItems';
import { RelayPoolDatabase } from 'core/relay/pool/db';

import type { ColumnsType } from 'antd/es/table';

export type RelayTableItem = Relay & { key: string };

export interface RelayGroupTableProp {
  groupId: string;
  relays: Relay[];
}

const RelayGroupTable: React.FC<RelayGroupTableProp> = ({
  groupId,
  relays,
}) => {
  const [data, setData] = useState<RelayTableItem[]>([]);
  const [selectRelays, setSelectRelays] = useState<Relay[]>([]);

  useEffect(() => {
    updateRelayData(relays);
  }, [relays]);

  const updateRelayData = async (relays: Relay[]) => {
    const db = new RelayPoolDatabase();
    const relaysFromDb = relays.map(r => {
      const relay = db.load(r.url);
      if (relay == null) {
        return r;
      }
      return relay;
    });
    const outdatedRelays = relaysFromDb
      .filter(r => RelayTracker.isOutdated(r.lastAttemptNip11Timestamp))
      .map(r => r!.url);

    let newRelays: Relay[] = relaysFromDb;
    if (outdatedRelays.length > 0) {
      message.loading(`update ${outdatedRelays.length} relays info..`);
      const details = await Nip11.getRelays(outdatedRelays);
      newRelays = relaysFromDb.map(r => {
        if (details.map(d => d.url).includes(r.url)) {
          return details.filter(d => d.url === r.url)[0]!;
        } else {
          return r;
        }
      });
      message.destroy();
    }

    if (newRelays.length > 0) {
      db.saveAll(newRelays);
    }

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
      render: (_, record) => (
        <SingleItemAction groupId={groupId} relay={record} />
      ),
    },
  ];

  return (
    <>
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
      <MultipleItemsAction
        groupId={groupId}
        open={selectRelays.length > 0}
        relays={selectRelays}
      />
    </>
  );
};

export default RelayGroupTable;
