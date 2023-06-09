import { EllipsisOutlined } from '@ant-design/icons';
import { Button, Modal, Table, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { shortPublicKey } from 'service/helper';
import { Nip11 } from 'service/nip/11';
import { Pool } from 'service/relay/pool';
import { Relay, RelayAccessType } from 'service/relay/type';
import styles from './index.module.scss';
import { FilterDropdownProps } from 'antd/es/table/interface';

const { Title, Paragraph, Text, Link } = Typography;

interface WebSocketBenchmarkProps {
  urls: string[];
  relays: Relay[];
}

interface BenchmarkResult {
  url: string;
  delay: number | null;
  isFailed: boolean;
}

const WebSocketBenchmark: React.FC<WebSocketBenchmarkProps> = ({
  urls,
  relays,
}) => {
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
  const [relayDataSource, setRelayDataSource] = useState<Relay[]>(relays);

  const updateRelayMap = async () => {
    const details = await Nip11.getRelays(
      relays.slice((currentPage - 1) * 10, currentPage * 10).map(r => r.url),
    );
    const oldRelays = relayDataSource.length > 0 ? relayDataSource : relays;
    const newRelays = oldRelays.map(r => {
      if (details.map(d => d.url).includes(r.url)) {
        return details.filter(d => d.url === r.url)[0]!;
      } else {
        return r;
      }
    });

    setRelayDataSource(newRelays);
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
    },
    {
      title: 'Status',
      dataIndex: 'isOnline',
      key: 'isOnline',
      sorter: true,
      render: isOnline => (isOnline ? 'Online' : 'Offline'),
    },
    {
      title: 'Nip',
      dataIndex: 'supportedNips',
      key: 'supportedNips',
      render: (num: number[] | null) => {
        const numbers = num || [];
        if (numbers.length <= 3) {
          return numbers.map((number, index) => (
            <span key={index} onClick={() => {console.log("not impl")}}>
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
                <span key={index} onClick={() => {console.log("not impl")}}>
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
      dataIndex: 'area',
      key: 'area',
      sorter: true,
      render: (area: string | null) => (area ? area : 'unknown'),
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
      dataIndex: 'operator',
      key: 'operator',
      render: (pubkey: string | null) =>
        pubkey ? shortPublicKey(pubkey) : pubkey,
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

  const handleOpenModal = record => {
    setSelectedRowData(record);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <div>
      <Table<Relay>
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys, selectedRows) => {
            console.log('Selected Row Keys:', selectedRowKeys);
            console.log('Selected Rows:', selectedRows);
          },
          // You can customize other selection properties here if needed
        }}
        columns={columns}
        rowClassName={rowClassName}
        dataSource={relayDataSource}
        pagination={paginationConfig}
      />

      <Modal
        title="Relay details"
        open={modalVisible}
        onCancel={handleCloseModal}
        onOk={handleCloseModal}
        okText={'Got it'}
        // Remove the footer (cancel button)
        //footer={[<button key="submit" onClick={handleCloseModal}>OK</button>]}
      >
        {/* Render modal content using selectedRowData */}
        {selectedRowData && (
          <>
            <p>{selectedRowData.url}</p>
            <p>{selectedRowData.about}</p>
            <p>{selectedRowData.software}</p>
            <p>{selectedRowData.supportedNips?.join(', ')}</p>
            <p>{selectedRowData.contact}</p>
            <p>{selectedRowData.area}</p>
            <p>{selectedRowData.operator}</p>
          </>
        )}
      </Modal>

      <Button onClick={handleBenchmark} disabled={isBenchmarking}>
        Start Benchmark
      </Button>
      <Button onClick={handleSort} disabled={!isBenchmarked}>
        Sort
      </Button>
    </div>
  );
};

export default WebSocketBenchmark;
