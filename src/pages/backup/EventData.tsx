import { Paths } from 'constants/path';
import { useTimeSince } from 'hooks/useTimeSince';
import React from 'react';
import { Nip19DataType, nip19Encode } from 'service/api';
import { maxStrings } from 'service/helper';
import styled from 'styled-components';
import { BPEvent } from './type';

export default function EventData({
  loading,
  events,
  eventsToRenderLimit,
  filterKind,
}: {
  loading: boolean;
  events: BPEvent[];
  eventsToRenderLimit: number;
  filterKind?: string;
}) {
  let eventsToRender: BPEvent[] = [];

  if (!loading) {
    eventsToRender = events
      .filter(e => {
        if (filterKind) {
          return e.kind.toString() === filterKind.toString();
        }
        return true;
      })
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, eventsToRenderLimit);
  }

  return (
    <div>
      {loading && (
        <p>
          Your Nostr activity will show up here after you have connected your
          client.
        </p>
      )}
      {eventsToRender.length > 0 && (
        <ul style={{ paddingLeft: '0px' }}>
          <div>
            {eventsToRender.map(({ id, kind, created_at, content }, index) => (
              <Item
                key={id}
                id={id}
                kind={kind}
                created_at={created_at}
                content={content}
              />
            ))}
          </div>
        </ul>
      )}
    </div>
  );
}

const Li = styled.li`
  text-decoration: none;
  list-style: none;
`;

const Link = styled.a`
  color: black;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`;

export function Item({ id, kind, created_at, content }) {
  return (
    <Li>
      <div
        style={{
          margin: '30px 0px',
          background: 'rgb(246, 249, 249)',
          padding: '5px',
          borderRadius: '5px',
        }}
      >
        <div style={{ color: 'gray' }}>
          <Link href={`${Paths.event}/${id}`}>
            <span>
              @{maxStrings(nip19Encode(id, Nip19DataType.EventId), 14)}
            </span>
          </Link>

          <span
            style={{
              color: 'gray',
              marginTop: '5px',
            }}
          >
            {' · '}
            {useTimeSince(created_at)}
          </span>
          <span>
            {' ·  '}
            {'<'}kind {kind}
            {'>'}
          </span>
        </div>
        <div style={{ marginTop: '10px' }}>{maxStrings(content, 100)}</div>
      </div>
    </Li>
  );
}
