import { shortPublicKey } from 'service/helper';
import { NpubResult } from 'service/nip/21';

export const Npub = (npub: NpubResult) => {
  if (npub.profile) {
    return (
      <div>
        ${npub.profile.name} ${npub.profile.picture} ${npub.profile.about}
      </div>
    );
  }

  return (
    <a
      href="${
	  i18n?.language + Paths.user + npub.pubkey
	}"
      target="_self"
    >
      @${shortPublicKey(npub.pubkey)}
    </a>
  );
};
