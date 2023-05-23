import { PublicKey } from 'service/api';
import { RelayMode, toRelayMode } from './type';
import { Relay } from 'service/relay/type';

export class RelaySelectorStore {
  storePrefix = 'relay-selector';
  groupIdPrefix = 'selected-group-id';
  modePrefix = 'selected-mode';

	autoRelayResultPrefix = 'auto-relay-result';

	/**********************/
  getSelectedGroupIdSaveKey(pubKey: PublicKey) {
    return `${this.storePrefix}:${this.groupIdPrefix}:${pubKey}`;
  }

  saveSelectedGroupId(pubKey: PublicKey, groupId: string) {
    localStorage.setItem(this.getSelectedGroupIdSaveKey(pubKey), groupId);
  }

  loadSelectedGroupId(pubKey: PublicKey) {
    const groupId = localStorage.getItem(
      this.getSelectedGroupIdSaveKey(pubKey),
    );
    return groupId;
  }

	/**********************/
  getSelectedModeSaveKey(pubKey: PublicKey) {
    return `${this.storePrefix}:${this.modePrefix}:${pubKey}`;
  }

  saveSelectedMode(pubKey: PublicKey, mode: RelayMode) {
    localStorage.setItem(this.getSelectedModeSaveKey(pubKey), mode);
  }

  loadSelectedMode(pubKey: PublicKey) {
    const mode = localStorage.getItem(this.getSelectedModeSaveKey(pubKey));
    if (mode) return toRelayMode(mode);
    return null;
  }

	/**********************/
	getAutoRelayResultSaveKey(pubKey: PublicKey) {
    return `${this.storePrefix}:${this.autoRelayResultPrefix}:${pubKey}`;
  }

  saveAutoRelayResult(pubKey: PublicKey, result: Relay[]) {
		const serializedResult = this.serializeAutoRelayResult(result);
    localStorage.setItem(this.getAutoRelayResultSaveKey(pubKey), serializedResult);
  }

  loadAutoRelayResult(pubKey: PublicKey) {
    const serializedResult = localStorage.getItem(this.getAutoRelayResultSaveKey(pubKey));
    if (serializedResult) return this.deserializeAutoRelayResult(serializedResult); 
    return null;
  }

	private serializeAutoRelayResult(relays: Relay[]): string{
		return JSON.stringify(relays);
	}

	private deserializeAutoRelayResult(relays: string): Relay[]{
		return JSON.parse(relays);
	}
}
