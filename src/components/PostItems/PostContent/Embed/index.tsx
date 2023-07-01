import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';

import {
  NpubResult,
  NprofileResult,
  NeventResult,
  NoteResult,
  NrelayResult,
  NaddrResult,
} from 'core/nip/21';

import { Naddr } from './Naddr';
import { Nevent } from './Nevent';
import { Note } from './Note';
import { Nprofile } from './Nprofile';
import { Npub } from './Npub';
import { Nrelay } from './Nrelay';
import { UserMap } from 'core/nostr/type';

export const transformRefEmbed = (
  content: string,
  {
    npubs,
    nevents,
    naddrs,
    notes,
    nprofiles,
    nrelays,
  }: {
    npubs?: NpubResult[];
    nevents?: NeventResult[];
    naddrs?: NaddrResult[];
    notes?: NoteResult[];
    nprofiles?: NprofileResult[];
    nrelays?: NrelayResult[];
  },
  userMap: UserMap
) => {
  let refTexts: string[] = [];
  let refComponents: any[] = [];

  if (npubs) {
    refTexts = refTexts.concat(npubs.map(n => n.key));
    refComponents = refComponents.concat(npubs.map(n => Npub(n, userMap)));
  }
  if (nevents) {
    refTexts = refTexts.concat(nevents.map(n => n.key));
    refComponents = refComponents.concat(nevents.map(n => Nevent(n, userMap)));
  }
  if (notes) {
    refTexts = refTexts.concat(notes.map(n => n.key));
    refComponents = refComponents.concat(notes.map(n => Note(n, userMap)));
  }
  if (nprofiles) {
    refTexts = refTexts.concat(nprofiles.map(n => n.key));
    refComponents = refComponents.concat(nprofiles.map(n => Nprofile(n, userMap)));
  }
  if (naddrs) {
    refTexts = refTexts.concat(naddrs.map(n => n.key));
    refComponents = refComponents.concat(naddrs.map(n => Naddr(n)));
  }
  if (nrelays) {
    refTexts = refTexts.concat(nrelays.map(n => n.key));
    refComponents = refComponents.concat(nrelays.map(n => Nrelay(n)));
  }

  const delimiters = refTexts;
  const pattern = new RegExp(delimiters.join('|'));
 
  // Split the string based on the substrings
  const textComponents = content
    .split(pattern)
    .map((text, index) => <span key={text+index}>{text}</span>);

  // Find the maximum length between the two arrays
  const maxLength = Math.max(textComponents.length, refComponents.length);

  // Use map and reduce to interleave the elements in the desired order
  const mergedArray = Array.from({ length: maxLength }).flatMap((_, index) =>
    [textComponents[index], refComponents[index]].filter(
      item => item !== undefined,
    ),
  );

  return mergedArray;
};
