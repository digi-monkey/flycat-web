import { useState, useEffect } from 'react';

export function useVersion() {
  const [version, setVersion] = useState<string>('0.0.0');

  useEffect(() => setVersion(process.env.NEXT_PUBLIC_REACT_APP_VERSION!), []);

  return version;
}
