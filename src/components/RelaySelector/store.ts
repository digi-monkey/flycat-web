import { PublicKey } from "service/api";

export class RelaySelectorStore {
	prefix = "relay-selector";

	getSelectedSaveKey(pubKey: PublicKey){
		return `${this.prefix}:selected-group-id:${pubKey}`;
	}

	saveSelectedGroupId(pubKey: PublicKey, groupId: string){
		localStorage.setItem(this.getSelectedSaveKey(pubKey), groupId);
	}

	loadSelectedGroupId(pubKey: PublicKey){
		const groupId = localStorage.getItem(this.getSelectedSaveKey(pubKey));	
		console.log("key: ", this.getSelectedSaveKey(pubKey), groupId);
		return groupId;
	}
}
