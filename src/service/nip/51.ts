import { EventTags, Filter, RawEvent, Tags, WellKnownEventKind } from "service/api";

export class Nip51 {

	static async createMuteList(){
		// todo
	}

	static async createPinList(){
		// todo
	}

	static async createPeopleList(){
		// todo
	}

	static async createBookmarkList(tags: Tags, content: string){
		const rawEvent = new RawEvent('', WellKnownEventKind.bookmark_list, tags, content);
		return rawEvent;
	}

	static async createPublicNoteBookmarkList(eventIds: string[]){
		// todo: distinct the long-form event id from eventIds to use "A" tag
		const identifier = "favorite";
		const tags: Tags = eventIds.map(id => [EventTags.E, id]);
		tags.push([EventTags.D, identifier]);
		const content = '';
		return await this.createBookmarkList(tags, content);
	}

	static createPublicBookmarkListFilter(pubkey: string): Filter{
		const identifier = "favorite";
		const filter: Filter = {
			authors: [pubkey],
			kinds: [WellKnownEventKind.bookmark_list],
			'#d': [identifier],
			limit: 1
		} 
		return filter;
	}
}
