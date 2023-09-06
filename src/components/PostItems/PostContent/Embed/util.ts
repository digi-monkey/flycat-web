import { NaddrResult, NeventResult, Nip21, NoteResult, NprofileResult, NpubResult, NrelayResult } from 'core/nip/21';

export interface EmbedRef {
  npubs?: NpubResult[];
  nevents?: NeventResult[];
  naddrs?: NaddrResult[];
  notes?: NoteResult[];
  nprofiles?: NprofileResult[];
  nrelays?: NrelayResult[];
}

export async function extractEmbedRef(
  content: string,
  relayUrls: string[],
): Promise<EmbedRef> {
  const npubs = await Nip21.transformNpub(content, relayUrls);
  const nprofiles = await Nip21.transformNprofile(content, relayUrls);
  const notes = await Nip21.transformNote(content, relayUrls);
  const nevents = await Nip21.transformNevent(content);
  const naddrs = await Nip21.transformNaddr(content, relayUrls);
  const nrelays = await Nip21.transformNrelay(content);

  return { npubs, nprofiles, notes, nevents, naddrs, nrelays };
}

export function getPubkeysFromEmbedRef(ref: EmbedRef){
  const npubsKey = ref.npubs?.map(n => n.pubkey) || [];
  const nprofilesKey = ref.nprofiles?.map(n => n.decodedMetadata.pubkey) || [];
  const notesKey = ref.notes?.map(n => n.noteEvent?.pubkey).filter(n => n != null) as string[] || [];
  const neventKey = ref.nevents?.map(n => n.noteEvent?.pubkey).filter(n => n != null) as string[] || [];
  const naddrsKey = ref.naddrs?.map(n => n.decodedMetadata.pubkey) || [];
  return [...npubsKey, ...nprofilesKey, ...notesKey, ...neventKey, ...naddrsKey ];
}
