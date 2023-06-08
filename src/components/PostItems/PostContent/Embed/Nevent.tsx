import { NeventResult } from 'service/nip/21';

export const Nevent = (nevent: NeventResult) => {
  if (nevent.noteEvent) {
    return (
      <div>
        ${nevent.noteEvent.id} ${nevent.noteEvent.content}
      </div>
    );
  }

  return (
    <a
      href="${
	  i18n?.language + Paths.user + '/' + nevent.decodedMetadata.id
	}"
      target="_self"
    >
      nevent@${nevent.decodedMetadata.id}
    </a>
  );
};
