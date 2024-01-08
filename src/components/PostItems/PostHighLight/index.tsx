import { CallWorker } from 'core/worker/caller';
import { PostUI } from '../PostItem/ui';
import { DbEvent } from 'core/db/schema';
import { dexieDb } from 'core/db';
import { deserializeMetadata } from 'core/nostr/content';
import { useLiveQuery } from 'dexie-react-hooks';
import { Event } from 'core/nostr/Event';
import { useMemo } from 'react';
import { message } from 'antd';
import { Nip9802, SourceType } from 'core/nip/9802';
import Link from 'next/link';
import { URLPreview } from '../PostContent/Link/embed/preview';
import dynamic from 'next/dynamic';

const EventPreview = dynamic(
  async () => {
    return await import('./EventPreview');
  },
  {
    loading: () => <p>Loading EventPreview...</p>,
    ssr: false,
    suspense: true,
  },
);

const ArticlePreview = dynamic(
  async () => {
    return await import('./ArticlePreview');
  },
  {
    loading: () => <p>Loading ArticlePreview...</p>,
    ssr: false,
    suspense: true,
  },
);

export interface PostHighLightProp {
  event: Event;
  worker: CallWorker;
  showFromCommunity?: boolean;
  extraMenu?: {
    label: string;
    onClick: (event: Event, msg: typeof message) => any;
  }[];
  extraHeader?: React.ReactNode;
}

export const PostHighLight: React.FC<PostHighLightProp> = ({
  event,
  worker,
  showFromCommunity,
  extraHeader,
  extraMenu,
}) => {
  const pks = useMemo(() => [event.pubkey], [event]);
  const profileEvents = useLiveQuery(
    async () => {
      const events = await dexieDb.profileEvent.bulkGet(pks);
      return events.filter(e => e != null) as DbEvent[];
    },
    [event],
    [] as DbEvent[],
  );

  const getUser = (pubkey: string) => {
    const user = profileEvents.find(e => e.pubkey === pubkey);
    if (user) {
      return deserializeMetadata(user.content);
    }
    return null;
  };

  const context = useMemo(() => {
    return Nip9802.getHighlightContext(event);
  }, [event]);

  const sourceUI = useMemo(() => {
    const source = Nip9802.getHighlightSource(event);
    if (source.type === SourceType.event) {
      return <EventPreview eventId={source.data} worker={worker} />;
    }
    if (source.type === SourceType.article) {
      return <ArticlePreview naddr={source.data} worker={worker} />;
    }
    if (source.type === SourceType.url) {
      return <URLPreview url={source.data} />;
    }
    if (source.type === SourceType.unknown) {
      return <Link href={''}>{source.data}</Link>;
    }
  }, [event]);

  // Function to highlight a substring within a string
  const highlightSubstring = (fullString: string, substring: string) => {
    const index = fullString.indexOf(substring);
    if (index !== -1) {
      return (
        <span className="text-gray-400">
          {fullString.substring(0, index)}
          <span className="text-gray-800">{substring}</span>
          {fullString.substring(index + substring.length)}
        </span>
      );
    }
    return fullString;
  };

  const contentUI = (
    <div>
      <div className="rounded-lg border border-solid border-gray-300 p-4">
        {context ? highlightSubstring(context, event.content) : ''}
      </div>
      <div className="mt-4">
        <div>Highlight from {sourceUI}</div>
      </div>
    </div>
  );

  return (
    <PostUI
      content={contentUI}
      profile={getUser(event.pubkey)}
      event={event as DbEvent}
      worker={worker}
      showFromCommunity={showFromCommunity}
      extraMenu={extraMenu}
      extraHeader={extraHeader}
    />
  );
};

export default PostHighLight;
