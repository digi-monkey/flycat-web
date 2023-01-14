import { EventSetMetadataContent, PublicKey } from './api';

export type UserMap = Map<
  PublicKey,
  EventSetMetadataContent & { created_at: number }
>;
