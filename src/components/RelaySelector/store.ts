import { PublicKey } from 'core/nostr/type';
import { RelayMode, toRelayMode } from './type';
import { Relay } from 'core/relay/type';

export class RelaySelectorStore {
  storePrefix = 'relay-selector';
  groupIdPrefix = 'selected-group-id';
  modePrefix = 'selected-mode';

	autoRelayResultPrefix = 'auto-relay-result';
  fastestRelayResultPrefix = 'fastest-relay-result';

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

  getFastestRelayResultSaveKey(pubKey: PublicKey) {
    return `${this.storePrefix}:${this.fastestRelayResultPrefix}:${pubKey}`;
  }

  saveFastestRelayResult(pubKey: PublicKey, relays: Relay[]) {
    const result = {relays, updated_at: Date.now()};
		const serializedResult = this.serializeFastestRelayResult(result);
    localStorage.setItem(this.getFastestRelayResultSaveKey(pubKey), serializedResult);
  }

  loadFastestRelayResult(pubKey: PublicKey) {
    const serializedResult = localStorage.getItem(this.getFastestRelayResultSaveKey(pubKey));
    if (serializedResult) return this.deserializeFastestRelayResult(serializedResult); 
    return null;
  }

  //------
	private serializeAutoRelayResult(relays: Relay[]): string{
		return JSON.stringify(relays);
	}

	private deserializeAutoRelayResult(relays: string): Relay[]{
		return JSON.parse(relays);
	}

  private serializeFastestRelayResult(res: {relays: Relay[], updated_at: number}): string{
		return JSON.stringify(res);
	}

	private deserializeFastestRelayResult(res: string): {relays: Relay[], updated_at: number}{
		return JSON.parse(res);
	}
}
