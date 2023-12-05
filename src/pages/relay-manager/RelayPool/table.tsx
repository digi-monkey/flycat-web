import { Avatar, Table, Badge, message } from 'antd';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { shortifyPublicKey } from 'core/nostr/content';
import { Nip11 } from 'core/nip/11';
import { Relay, RelayTracker } from 'core/relay/type';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { RelayDetailModal } from '../Modal/detail';
import { MultipleItemsPoolAction } from '../Action/multipleItemsPool';
import { EventSetMetadataContent } from 'core/nostr/type';
import { RelayPoolDatabase } from 'core/relay/pool/db';
import { RelayGroup as RelayGroupClass } from 'core/relay/group';

import styles from './table.module.scss';
import { useMatchMobile } from 'hooks/useMediaQuery';
import Icon from 'components/Icon';

interface RelayPoolTableProp {
  relays: Relay[];
  groups: RelayGroupClass | undefined;
  setGroups: Dispatch<SetStateAction<RelayGroupClass | undefined>>;
}

interface BenchmarkResult {
  url: string;
  delay: number | null;
  isFailed: boolean;
}

export type RelayTableItem = Relay & { key: string };

const RelayPoolTable: React.FC<RelayPoolTableProp> = ({
  relays,
  groups,
  setGroups,
}) => {
  const isMobile = useMatchMobile();
  const [messageApi, contextHolder] = message.useMessage();
  const [urls, setUrls] = useState<string[]>(relays.map(r => r.url));
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setResults(
      urls.map(url => {
        return { url, delay: null, isFailed: false };
      }),
    );
  }, [urls]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [data, setData] = useState<RelayTableItem[]>([]);
  const [relayDataSource, setRelayDataSource] = useState<Relay[]>([]);

  const updateRelayMap = async () => {
    setIsUpdating(true);
    const currentRelays = relays.slice(
      (currentPage - 1) * 10,
      currentPage * 10,
    );

    const initRelays = relayDataSource.length > 0 ? relayDataSource : relays;
    setRelayDataSource(initRelays);
    setData(
      initRelays.map(r => {
        return { ...r, ...{ key: r.url } };
      }),
    );

    const outdatedRelays = currentRelays.filter(r =>
      RelayTracker.isOutdated(r.lastAttemptNip11Timestamp),
    );
    if (outdatedRelays.length > 0) {
      messageApi.loading(`update ${outdatedRelays.length} relays info..`);
      Nip11.updateRelays(outdatedRelays).then(details => {
        // save the updated relay info
        if (details.length > 0) {
          const db = new RelayPoolDatabase();
          db.saveAll(details);

          const oldRelays =
            relayDataSource.length > 0 ? relayDataSource : relays;
          const newRelays = oldRelays.map(r => {
            if (details.map(d => d.url).includes(r.url)) {
              return details.filter(d => d.url === r.url)[0]!;
            } else {
              return r;
            }
          });

          setRelayDataSource(newRelays);
          setData(
            newRelays.map(r => {
              return { ...r, ...{ key: r.url } };
            }),
          );
        }
        messageApi.destroy();
      });
    }
    setIsUpdating(false);
  };

  useEffect(() => {
    if (relays.length === 0) return;
    if(isUpdating)return;
    updateRelayMap();
  }, [relays.length, currentPage]);

  const paginationConfig = {
    pageSize: 10,
    current: currentPage,
    onChange: setCurrentPage,
  };

  const rowSelection = {
    onChange: (selectedRowKeys: React.Key[], selectedRows: Relay[]) => {
      console.log(
        `selectedRowKeys: ${selectedRowKeys}`,
        'selectedRows: ',
        selectedRows,
      );
    },
  };

  const columns = isMobile
    ? [
        {
          title: 'Url',
          dataIndex: 'url',
          key: 'url',
          render: (url: string) => url.split('wss://'),
        },
        {
          // Invisible column for displaying three-dot icon
          dataIndex: 'actions',
          key: 'actions',
          className: 'actions-column',
          width: 40,
          render: (_, record) => (
            <Icon
              type='icon-more-horizontal'
              onClick={() => handleOpenModal(record)}
              style={{ cursor: 'pointer' }}
            />
          ),
        },
      ]
    : [
        {
          title: 'Type',
          dataIndex: 'accessType',
          key: 'accessType',
        },
        {
          title: 'Url',
          dataIndex: 'url',
          key: 'url',
          render: (url: string) => url.split('wss://'),
        },
        {
          title: 'Status',
          dataIndex: 'isOnline',
          key: 'isOnline',
          sorter: true,
          render: isOnline => (
            <Badge
              status={isOnline ? 'success' : 'error'}
              className="connection-status-dot"
              text={isOnline ? 'Online' : 'Offline'}
            />
          ),
        },
        {
          title: 'Nip',
          dataIndex: 'supportedNips',
          key: 'supportedNips',
          render: (num: number[] | null) => {
            const numbers = num || [];
            if (numbers.length <= 3) {
              return numbers.map((number, index) => (
                <span
                  key={index}
                  onClick={() => {
                    console.log('not impl');
                  }}
                >
                  {number}
                  {index !== numbers.length - 1 && ' '}
                </span>
              ));
            } else {
              const displayedNumbers = numbers.slice(0, 3);
              const remainingCount = numbers.length - displayedNumbers.length;
              return (
                <>
                  {displayedNumbers.map((number, index) => (
                    <span
                      key={index}
                      onClick={() => {
                        console.log('not impl');
                      }}
                    >
                      {number}
                      {index !== displayedNumbers.length - 1 && ' '}
                    </span>
                  ))}
                  <span>+{remainingCount}</span>
                </>
              );
            }
          },
        },
        {
          title: 'Country',
          dataIndex: 'relayCountries',
          key: 'relayCountries',
          sorter: true,
          render: (relayCountries: string[] | undefined) =>
            relayCountries ? JSON.stringify(relayCountries) : 'unknown',
          filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
          }: FilterDropdownProps) => (
            <div style={{ padding: 8 }}>
              <button onClick={clearFilters}>Reset</button>
            </div>
          ),
          onFilter: (value, record) =>
            record.country.toLowerCase().includes(value.toLowerCase()),
        },
        {
          title: 'Operator',
          dataIndex: 'operatorDetail',
          key: 'operatorDetail',
          render: (
            operatorDetail: EventSetMetadataContent | undefined,
            record: Relay,
          ) =>
            operatorDetail ? (
              <>
                <Avatar src={operatorDetail.picture} alt="picture" />{' '}
                {operatorDetail.name}
              </>
            ) : (
              <>
                <Avatar alt="picture" /> {shortifyPublicKey(record.operator)}
              </>
            ),
        },
        // Other columns...
        {
          // Invisible column for displaying three-dot icon
          dataIndex: 'actions',
          key: 'actions',
          className: 'actions-column',
          width: 40,
          render: (_, record) => (
            <Icon
              type='icon-more-horizontal'
              onClick={() => handleOpenModal(record)}
              style={{ cursor: 'pointer', width: '20px', height: '20px' }}
            />
          ),
        },
      ];

  const rowClassName = (_, index) =>
    `${styles['hoverable-row']} ${styles[`row-${index}`]}`;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState<Relay | null>(null);
  const [selectedRelays, setSelectedRelays] = useState<Relay[]>([]);

  const handleOpenModal = record => {
    setSelectedRowData(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <div className={styles.tableContainer}>
      {contextHolder}
      <MultipleItemsPoolAction
        open={selectedRelays.length > 0}
        relays={selectedRelays}
        groups={groups}
        setGroups={setGroups}
      />
      <Table<RelayTableItem>
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys, selectedRows) => {
            console.log('Selected Row Keys:', selectedRowKeys);
            console.log('Selected Rows:', selectedRows);
            setSelectedRelays(selectedRows);
          },
        }}
        columns={columns}
        rowClassName={rowClassName}
        dataSource={data}
        pagination={paginationConfig}
        loading={data.length === 0}
      />

      {selectedRowData && (
        <RelayDetailModal
          relay={selectedRowData}
          open={modalVisible}
          onCancel={handleCloseModal}
        />
      )}
    </div>
  );
};

export default RelayPoolTable;
