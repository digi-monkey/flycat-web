import { useState, useEffect } from 'react';
import execa from 'execa';

export function useCommitId(): string {
  const [commitId, setCommitId] = useState<string>('');

  useEffect(() => {
    setCommitId(process.env.REACT_APP_COMMIT_HASH!);
  }, []);

  return commitId;
}
