import { NrelayResult } from 'core/nip/21';

export const Nrelay = (nrelay: NrelayResult) => {
  return <div>{nrelay.decodedMetadata}</div>;
};
