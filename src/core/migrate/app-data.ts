import { SELECTED_TAB_KEY_STORAGE_KEY, SELECTED_FILTER_STORAGE_KEY } from "pages/home/constants";

// client-side localStorage app data
export const migrateFn = (storeVersion: number) => {
	if(storeVersion === 0){
		// this is a patch for commit https://github.com/digi-monkey/flycat-web/pull/370
		// useLocalStorage will use JSON.stringify to serialize string value brings double-quote " in

		const d1 = localStorage.getItem(SELECTED_TAB_KEY_STORAGE_KEY);
		if(d1 && !d1.includes('"')){
			localStorage.setItem(SELECTED_TAB_KEY_STORAGE_KEY, JSON.stringify(d1));
		}

		const d2 = localStorage.getItem(SELECTED_FILTER_STORAGE_KEY);
		if(d2 && !d2.includes('"')){
			localStorage.setItem(SELECTED_FILTER_STORAGE_KEY, JSON.stringify(d2));
		}
	}
}
