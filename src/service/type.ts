import { EventSetMetadataContent, PublicKey } from './event/type';

export type UserMap = Map<
  PublicKey,
  EventSetMetadataContent & { created_at: number }
>;
