import { Nip21 } from 'service/nip/21';
import { UserMap } from 'service/type';

export async function extractEmbedRef(
  content: string,
  userMap: UserMap,
  relayUrls: string[],
) {
  const npubs = await Nip21.transformNpub(content, userMap, relayUrls);
  const nprofiles = await Nip21.transformNprofile(content, userMap, relayUrls);
  const notes = await Nip21.transformNote(content, relayUrls);
  const nevents = await Nip21.transformNevent(content, userMap);
  const naddrs = await Nip21.transformNaddr(content, relayUrls);
  const nrelay = await Nip21.transformNrelay(content);

  return { npubs, nprofiles, notes, nevents, naddrs, nrelay };
}
