import { PubkeyRelay } from "./pubkey-relay";

export class Assignment {
	static calcScore(pubkeyRelay: PubkeyRelay){
		let score = 0;
		score += pubkeyRelay.last_kind_3 * 5;
		score += pubkeyRelay.last_kind_0 * 3;
		score += pubkeyRelay.last_kind_1 * 1;
		score += pubkeyRelay.last_kind_30023 * 1;
		return score;
	}
}
