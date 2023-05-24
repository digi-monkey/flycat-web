import { Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { Pool } from 'service/relay/pool';

interface WebSocketBenchmarkProps {
  urls: string[];
}

interface BenchmarkResult {
  url: string;
  delay: number | null;
  isFailed: boolean;
}

const WebSocketBenchmark: React.FC<WebSocketBenchmarkProps> = ({ urls }) => {
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

  return (
    <div>
      <Button onClick={handleBenchmark} disabled={isBenchmarking}>
        Start Benchmark
      </Button>
      <Button onClick={handleSort} disabled={!isBenchmarked}>
        Sort
      </Button>
      {!isSorted && (
        <ul>
          {urls.map((url, index) => (
            <li key={index}>
              {url}{' '}
              {results[index] &&
                results[index].delay !== null &&
                `${results[index].delay}ms `}
              {results[index] && results[index].isFailed && (
                <span style={{ color: 'red' }}>Failed</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {isSorted && (
        <ul>
          {results.map((res, index) => (
            <li key={index}>
              {res.url} {res.delay}
              {'ms'}{' '}
              {res.isFailed && <span style={{ color: 'red' }}>Failed</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WebSocketBenchmark;
