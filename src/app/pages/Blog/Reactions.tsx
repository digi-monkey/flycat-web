import { Bookmark } from 'app/components/layout/msg/reaction/Bookmark';
import { Repost } from 'app/components/layout/msg/reaction/Repost';
import { Tipping } from 'app/components/layout/msg/reaction/Tipping';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { isEmptyStr } from 'service/helper';
import { Article } from 'service/nip/23';

const styles = {
  reaction: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
};
export const Reactions = ({
  article,
  pk,
  lightingAddress,
}: {
  pk: string;
  article: Article;
  lightingAddress?: string;
}) => {
  const { t } = useTranslation();

  return (
    <div style={{ marginTop: '15px', display: 'inline-block' }}>
      <span>
        <span style={styles.reaction}>
          {!isEmptyStr(lightingAddress) && (
            <Tipping address={lightingAddress!} />
          )}
        </span>
        <span
          style={styles.reaction}
          onClick={() => {
            alert('working on it!');
          }}
        >
          <Repost eventId={article.eventId} />
        </span>
        <span
          style={styles.reaction}
          onClick={() => {
            alert('working on it!');
          }}
        >
          <Bookmark eventId={article.eventId} />
        </span>
      </span>
    </div>
  );
};
