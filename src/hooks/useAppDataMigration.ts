import { useEffect } from "react";

const APP_DATA_VERSION_KEY = "app-data-version";
const CURRENT_VERSION = 1;

export function useAppDataMigration(migrateFn: (storeVersion: number)=>any){
  useEffect(()=>{
		const _storedVersion = localStorage.getItem(APP_DATA_VERSION_KEY);
		const storedVersion = _storedVersion ? parseInt(_storedVersion, 10) : 0; // 0 means no version found
		if(storedVersion < CURRENT_VERSION){
			try {
				migrateFn(storedVersion);
				localStorage.setItem(APP_DATA_VERSION_KEY, CURRENT_VERSION.toString());
			} catch (error: any) {
				console.debug(`failed to migrate app data version from ${storedVersion} to ${CURRENT_VERSION}`, error.message);
			}
		}
  }, []);
}
