import z from 'zod';

const relaySchema = z.object({
  read: z.boolean(),
  write: z.boolean(),
  url: z.string(),
});

export const relayGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  relays: z.array(relaySchema),
  createdAt: z.number(),
});

export const legacyRelayGroupMapSchema = z.array(
  z.tuple([z.string(), z.array(relaySchema)]),
);

export const relayGroupMapSchema = z.array(
  z.tuple([z.string(), relayGroupSchema]),
);
