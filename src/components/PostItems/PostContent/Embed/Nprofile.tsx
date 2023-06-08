import { shortPublicKey } from 'service/helper';
import { NprofileResult } from 'service/nip/21';

export const Nprofile = (nprofile: NprofileResult) => {
  if (nprofile.profile) {
    return (
      <div>
        ${nprofile.profile.name} ${nprofile.profile.picture} $
        {nprofile.profile.about}
      </div>
    );
  }

  return (
    <a
      href="${
	  i18n?.language + Paths.user + nprofile.decodedMetadata.pubkey
	}"
      target="_self"
    >
      @${shortPublicKey(nprofile.decodedMetadata.pubkey)}
    </a>
  );
};
