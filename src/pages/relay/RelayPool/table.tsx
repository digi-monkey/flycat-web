import { EllipsisOutlined } from '@ant-design/icons';
import { Avatar, Button, Table, Badge } from 'antd';
import React, { useEffect, useState } from 'react';
import { shortPublicKey } from 'service/helper';
import { Nip11 } from 'service/nip/11';
import { Relay, RelayTracker } from 'service/relay/type';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { RelayDetailModal } from '../Modal/detail';
import { MultipleItemsPoolAction } from '../Action/multipleItemsPool';
import { EventSetMetadataContent } from 'service/api';
import { RelayPoolDatabase } from 'service/relay/pool/db';

import styles from './table.module.scss';

interface RelayPoolTableProp {
  relays: Relay[];
}

interface BenchmarkResult {
  url: string;
  delay: number | null;
  isFailed: boolean;
}

export type RelayTableItem = Relay & { key: string };

const RelayPoolTable: React.FC<RelayPoolTableProp> = ({ relays }) => {
  const [urls, setUrls] = useState<string[]>(relays.map(r => r.url));
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [isBenchmarked, setIsBenchmarked] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

  useEffect(() => {
    setResults(
      urls.map(url => {
        return { url, delay: null, isFailed: false };
      }),
    );
  }, [urls]);

  const handleBenchmark = () => {
    setResults([]);
    setIsBenchmarking(true);

    let completedCount = 0;

    const checkBenchmarkCompletion = () => {
      if (completedCount === urls.length) {
        setIsBenchmarking(false);
        setIsBenchmarked(true);
      }
    };

    urls.forEach((url, index) => {
      const start = performance.now();
      const socket = new WebSocket(url);

      socket.onopen = () => {
        completedCount++;
        checkBenchmarkCompletion();

        const delay = Math.round(performance.now() - start);
        setResults(prevResults => {
          const updatedResults = [...prevResults];
          updatedResults[index] = { url, delay, isFailed: false };
          return updatedResults;
        });
        socket.close();
      };

      socket.onerror = () => {
        completedCount++;
        checkBenchmarkCompletion();

        const delay = 10000000000000000;
        setResults(prevResults => {
          const updatedResults = [...prevResults];
          updatedResults[index] = { url, delay, isFailed: true };
          return updatedResults;
        });
        socket.close();
      };
    });
  };

  const handleSort = () => {
    setResults(prevResults =>
      [...prevResults].sort((a, b) =>
        a.delay !== null && b.delay !== null ? a.delay - b.delay : -1,
      ),
    );
    setIsSorted(true);
  };

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [data, setData] = useState<RelayTableItem[]>([]);
  const [relayDataSource, setRelayDataSource] = useState<Relay[]>(relays);

  const updateRelayMap = async () => {
    const currentRelays = relays.slice(
      (currentPage - 1) * 10,
      currentPage * 10,
    );
    const details = await Nip11.updateRelays(
      currentRelays.filter(r => RelayTracker.isOutdated(r.lastAttemptNip11Timestamp)),
    );
    // save the updated relay info
    if (details.length > 0) {
      const db = new RelayPoolDatabase();
      db.saveAll(details);
    }

    const oldRelays = relayDataSource.length > 0 ? relayDataSource : relays;
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
  };

  useEffect(() => {
    updateRelayMap();
  }, [relays, currentPage]);

  const handlePaginationChange = (pagination: number) => {
    setCurrentPage(pagination);
  };

  const paginationConfig = {
    pageSize: 10,
    current: currentPage,
    onChange: handlePaginationChange,
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

  const columns = [
    {
      title: 'Type',
      dataIndex: 'accessType',
      key: 'accessType',
    },
    {
      title: 'Url',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => url.split("wss://")
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
            <Avatar alt="picture" /> {shortPublicKey(record.operator)}
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
        <EllipsisOutlined
          onClick={() => handleOpenModal(record)}
          style={{ cursor: 'pointer' }}
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
    <div>
      {relays.length}
      <Table<RelayTableItem>
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys, selectedRows) => {
            console.log('Selected Row Keys:', selectedRowKeys);
            console.log('Selected Rows:', selectedRows);
            setSelectedRelays(selectedRows);
          },
          // You can customize other selection properties here if needed
        }}
        columns={columns}
        rowClassName={rowClassName}
        dataSource={data}
        pagination={paginationConfig}
      />
      <MultipleItemsPoolAction
        open={selectedRelays.length > 0}
        relays={selectedRelays}
      />

      {selectedRowData && (
        <RelayDetailModal
          relay={selectedRowData}
          open={modalVisible}
          onCancel={handleCloseModal}
        />
      )}

      <Button onClick={handleBenchmark} disabled={isBenchmarking}>
        Start Benchmark
      </Button>
      <Button onClick={handleSort} disabled={!isBenchmarked}>
        Sort
      </Button>
    </div>
  );
};

export default RelayPoolTable;
