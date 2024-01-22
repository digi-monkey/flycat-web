import z from 'zod';
import { relayGroupSchema } from './schema';

export type RelayGroup = z.infer<typeof relayGroupSchema>;
export type RelayGroupMap = Map<string, RelayGroup>;
