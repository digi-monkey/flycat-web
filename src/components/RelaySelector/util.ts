import { RelayGroups, RelayMode } from "./type";

export function getSelectGroupId(groups: RelayGroups){
	return Object.keys(groups).filter(key => groups[key] != null).map(key => `${key}`);
}
