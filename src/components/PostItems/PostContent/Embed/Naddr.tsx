import { NaddrResult } from 'service/nip/21';

export const Naddr = (naddr: NaddrResult) => {
  if (naddr.replaceableEvent) {
    return <div>${naddr.replaceableEvent.content}</div>;
  }

  return (
    <a
      href="${
	  i18n?.language + Paths.user + naddr.decodedMetadata.kind
	}"
      target="_self"
    >
      @addr ${naddr.decodedMetadata.pubkey}:${naddr.decodedMetadata.kind}:$
      {naddr.decodedMetadata.identifier}
    </a>
  );
};
