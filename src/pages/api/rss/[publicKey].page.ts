import { eventToFeed } from 'service/feed';
import { callSubFilter } from '../util';
import { NextApiResponse, NextApiRequest } from 'next';
import { Filter, WellKnownEventKind } from 'service/api';

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
  const events = await callSubFilter(filter);
  const feed = eventToFeed(events, publicKey).rss2();
  res.setHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
  return res.status(200).send(feed);
}
