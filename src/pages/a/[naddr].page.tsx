import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { DecodedNaddrResult, Nip19, Nip19ShareableDataType } from 'core/nip/19';
import { Paths } from 'constants/path';

type UserParams = {
  naddr: string;
};

const Addr = () => {
  const router = useRouter();
  const query = router.query as UserParams;
  const naddr = useMemo(() => query.naddr, [query]);

  const redirect = () => {
    if (!naddr) return;

    if (!naddr.startsWith('naddr')) {
      return router.push('/404');
    }

    try {
      const res = Nip19.decodeShareable(naddr);
      if (res.type === Nip19ShareableDataType.Naddr) {
        const addr = res.data as DecodedNaddrResult;
        const pk = addr.pubkey;
        const id = addr.identifier;
        return router.push(Paths.post + pk + '/' + id);
      }

      return router.push('/404');
    } catch (error) {
      return router.push('/404');
    }
  };

  useEffect(() => {
    redirect();
  }, [naddr]);
};

export default Addr;
