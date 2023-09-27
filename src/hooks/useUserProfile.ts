import { profileQuery } from "core/db";
import { deserializeMetadata } from "core/nostr/content";
import { EventSetMetadataContent } from "core/nostr/type";
import { useEffect, useState } from "react";
import { isValidPublicKey } from "utils/validator";

export function useUserProfile(pk: string){
	const [authorProfile, setAuthorProfile] = useState<EventSetMetadataContent>();
	useEffect(()=>{
		if(!isValidPublicKey(pk))return;

		profileQuery.getProfileByPubkey(pk).then(profile => {
			if(profile){
				const authorMetadata = deserializeMetadata(profile.content);
				setAuthorProfile(authorMetadata);
			}
		});
	}, [])

	return authorProfile;
}
