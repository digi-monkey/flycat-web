import { Relay } from 'core/relay/type';
import { RelayDetailModal } from '../Modal/detail';
import { useState } from 'react';
import { Button, Empty } from 'antd';

import styles from './index.module.scss';

export interface SearchResultProps {
  relays: Relay[];
  keyWords: string;
}
export const SearchResult: React.FC<SearchResultProps> = ({
  relays,
  keyWords,
}) => {
  const [viewRelay, setViewRelay] = useState<Relay>();
  const [modalVisible, setModalVisible] = useState(false);
  const results = relays.filter(
    r => r.url.includes(keyWords) || r.about?.includes(keyWords),
  );
  return (
    <div className={styles.root}>
      {results.map(r => (
        <li key={r.url} className={styles.relayItem}>
          <div className={styles.url}>{r.url}</div>
          <Button
            type="link"
            onClick={() => {
              setViewRelay(r);
              setModalVisible(true);
            }}
          >
            view
          </Button>
        </li>
      ))}
      {results.length === 0 && <Empty />}

      {viewRelay && (
        <RelayDetailModal
          relay={viewRelay}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};
