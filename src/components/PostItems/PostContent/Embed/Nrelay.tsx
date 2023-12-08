import { NrelayResult } from 'core/nip/21';

export const Nrelay: React.FC<{ nrelay: NrelayResult }> = ({ nrelay }) => {
  return <div>{nrelay.decodedMetadata}</div>;
};
