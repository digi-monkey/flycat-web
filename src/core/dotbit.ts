import { Nip19DataType, Nip19 } from 'core/nip/19';
import dynamic from 'next/dynamic'

export async function getPublicKeyFromDotBit(
  didAlias: string,
): Promise<string | null> {
  //@ts-ignore
  const createInstance: any = dynamic(() => import('dotbit').then(mod => mod.createInstance), {
    ssr: false,
  });

  const dotbit =  createInstance();
  const records = await dotbit.records(didAlias, 'profile.nostr');

  const record = records[0];
  if (record == null || record.value.length === 0) {
    console.error('nostr key value not found in' + didAlias);
    return null;
  }

  const npubPk = record.value;
  const decoded = Nip19.decode(npubPk);
  if (decoded.type !== Nip19DataType.Npubkey) {
    throw new Error(
      'Nip19 Decode error: invalid nostr key value in dotbit ' +
        didAlias +
        ' ' +
        npubPk,
    );
  }
  const pk = decoded.data;
  return pk;
}

export function isDotBitName(name: string): boolean {
  return name.endsWith('.bit');
}
