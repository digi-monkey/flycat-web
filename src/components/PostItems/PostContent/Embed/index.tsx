import { Paths } from 'constants/path';
import { i18n } from 'next-i18next';

import {
  NpubResult,
  NprofileResult,
  NeventResult,
  NoteResult,
  NrelayResult,
  NaddrResult,
} from 'service/nip/21';

import { Naddr } from './Naddr';
import { Nevent } from './Nevent';
import { Note } from './Note';
import { Nprofile } from './Nprofile';
import { Npub } from './Npub';
import { Nrelay } from './Nrelay';

export const transformRefEmbed = (
  content: string,
  {
    npub,
    nevent,
    naddr,
    notes,
    nprofile,
    nrelay,
  }: {
    npub?: NpubResult[];
    nevent?: NeventResult[];
    naddr?: NaddrResult[];
    notes?: NoteResult[];
    nprofile?: NprofileResult[];
    nrelay: NrelayResult[];
  },
) => {
  let refTexts: string[] = [];
  let refComponents: any[] = [];

  if (npub) {
    refTexts = refTexts.concat(npub.map(n => n.key));
    refComponents = refComponents.concat(npub.map(n => Npub(n)));
  }
  if (nevent) {
    refTexts = refTexts.concat(nevent.map(n => n.key));
    refComponents = refComponents.concat(nevent.map(n => Nevent(n)));
  }
  if (notes) {
    refTexts = refTexts.concat(notes.map(n => n.key));
    refComponents = refComponents.concat(notes.map(n => Note(n)));
  }
  if (nprofile) {
    refTexts.concat(nprofile.map(n => n.key));
    refComponents = refComponents.concat(nprofile.map(n => Nprofile(n)));
  }
  if (naddr) {
    refTexts = refTexts.concat(naddr.map(n => n.key));
    refComponents = refComponents.concat(naddr.map(n => Naddr(n)));
  }
  if (nrelay) {
    refTexts = refTexts.concat(nrelay.map(n => n.key));
    refComponents = refComponents.concat(nrelay.map(n => Nrelay(n)));
  }

  const delimiters = refTexts;
  const pattern = new RegExp(delimiters.join('|'));
  // Split the string based on the substrings
  const textComponents = content
    .split(pattern)
    .map(text => <span key={text}>{text}</span>);

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
