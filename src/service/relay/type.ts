import { PublicKey } from "service/api";

export enum RelayAccessType {
	Public,
	Pay,
	Private,
}

export interface Relay {
	read: boolean;
	write: boolean;
	url: string;
	accessType?: RelayAccessType;
	operator?: PublicKey;
	about?: string;
	area?: string;
	isConnected?: boolean;
	benchmark?: number; // delay in milliseconds
}

