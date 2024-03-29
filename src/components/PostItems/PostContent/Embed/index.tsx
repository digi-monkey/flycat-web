import { useEffect, useState } from 'react';
import { ParsedFragment } from '../text';
import { Naddr } from './Naddr';
import { Nevent } from './Nevent';
import { Note } from './Note';
import { Nprofile } from './Nprofile';
import { Npub } from './Npub';
import { Nrelay } from './Nrelay';
import { SmallLoader } from 'components/Loader';
import { readOnlyFallbackRelays } from 'core/relay/pool/seed';
import {
  NaddrResult,
  NeventResult,
  Nip21,
  NoteResult,
  NprofileResult,
  NpubResult,
  NrelayResult,
  TransformResult,
} from 'core/nip/21';

export interface ParsedMentionProp {
  res: TransformResult;
}
export const ParsedNostrEmbed: React.FC<ParsedMentionProp> = ({ res }) => {
  if (res.type === 'naddr') {
    return <Naddr naddr={res.result as NaddrResult} />;
  }
  if (res.type === 'nevent') {
    return <Nevent nevent={res.result as NeventResult} />;
  }
  if (res.type === 'note') {
    return <Note note={res.result as NoteResult} />;
  }
  if (res.type === 'nprofile') {
    return <Nprofile nprofile={res.result as NprofileResult} />;
  }
  if (res.type === 'npub') {
    return <Npub npub={res.result as NpubResult} />;
  }
  if (res.type === 'nrelay') {
    return <Nrelay nrelay={res.result as NrelayResult} />;
  }

  return <span>{res.result as string}</span>;
};

export const NostrEmbed: React.FC<{ data: ParsedFragment }> = ({ data }) => {
  const [transformFragment, setTransformFragment] = useState<TransformResult>();

  const parse = async () => {
    const val = await Nip21.transform(data, readOnlyFallbackRelays);
    setTransformFragment(val);
  };

  useEffect(() => {
    parse();
  }, []);

  return transformFragment ? (
    <ParsedNostrEmbed res={transformFragment} />
  ) : (
    <SmallLoader isLoading={true} />
  );
};
