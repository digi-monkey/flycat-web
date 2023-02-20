import { createInstance } from 'dotbit';
import { nip19Decode, Nip19DataType } from './api';

export async function getPublicKeyFromDotBit(
  didAlias: string,
): Promise<string | null> {
  const dotbit = createInstance();
  const records = await dotbit.records(didAlias, 'profile.nostr');

  const record = records[0];
  if (record == null || record.value.length === 0) {
    console.error('nostr key value not found in' + didAlias);
    return null;
  }

  const npubPk = record.value;
  const decoded = nip19Decode(npubPk);
  if (decoded.type !== Nip19DataType.Pubkey) {
    throw new Error(
      'nip19Decode error: invalid nostr key value in dotbit ' +
        didAlias +
        ' ' +
        npubPk,
    );
  }
  const pk = decoded.data;
  return pk;
}
