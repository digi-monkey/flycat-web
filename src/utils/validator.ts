export function isValidPublicKey(key: any): boolean {
  return (
    typeof key === 'string' && key.length === 64 && /^[0-9a-fA-F]+$/.test(key)
  );
}

export function isValidWssUrl(url: string): boolean {
  if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
    return false;
  }

  const illegalCharacters = /[\s\u0000-\u001F\u007F-\u009F]/;
  if (illegalCharacters.test(url)) {
    return false;
  }

  if (url.startsWith('wss://')) {
    const domainNameRegex =
      /^wss:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    return domainNameRegex.test(url);
  }

  if (url.startsWith('ws://')) {
    const domainNameRegex =
      /^ws:\/\/(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

    return domainNameRegex.test(url);
  }

  return false;
}

// invalid string including ""
export function isEmptyStr(text?: string) {
  return text == null || text.length === 0;
}

export function isEqualMaps(map1: Map<string, any>, map2: Map<string, any>) {
  let testVal;
  if (map1.size !== map2.size) {
    return false;
  }
  const map1Arr = Array.from(map1.entries());
  for (const [key, val] of map1Arr) {
    testVal = map2.get(key);
    // in cases of an undefined value, make sure the key
    // actually exists on the object so there are no false positives
    if (testVal !== val || (testVal === undefined && !map2.has(key))) {
      return false;
    }
  }
  return true;
}

export function isValidJSONStr(str: any) {
  try {
    JSON.parse(str);
    return true;
  } catch (error: any) {
    console.debug(error.message);
    return false;
  }
}
