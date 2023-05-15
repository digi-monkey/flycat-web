import { Relay } from "service/relay/type";

export interface RelayGroups {
	[name: string]: Relay[] | undefined;
}
