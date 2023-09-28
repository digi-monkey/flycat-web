import { NextApiResponse, NextApiRequest } from 'next';
import { records } from './record';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { name } = req.query;
  if (typeof name !== 'string')
    return res.status(403).json({ error: 'Invalid name' });

  // Check if the requested name exists in the mapping
  if (records[name]) {
    // If it exists, send a JSON response with the corresponding hash value
    res.status(200).json({ names: { [name]: records[name] } });
  } else {
    // If the requested name doesn't exist, send a 404 Not Found response
    res.status(404).json({ error: 'Name not found' });
  }
}
