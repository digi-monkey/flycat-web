import { eventToFeed } from 'core/rss';
import { callSubFilter } from 'core/backend/sub';
import { Filter, WellKnownEventKind } from 'core/nostr/type';
import { NextApiResponse, NextApiRequest } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { publicKey } = req.query;
  if (typeof publicKey !== 'string')
    return res.status(500).send('error: invalid publicKey');

  const filter: Filter = {
    authors: [publicKey],
    kinds: [WellKnownEventKind.long_form],
    limit: 50,
  };
  const events = await callSubFilter({ filter });
  const feed = eventToFeed(events, publicKey).rss2();
  res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
  return res.status(200).send(feed);
}
