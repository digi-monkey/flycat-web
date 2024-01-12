import { Button } from 'components/shared/ui/Button';
import useGetNip65RelayListMutation from '../hooks/useGetNip65RelayListMutation';

export default function GetNIP65RelayButton() {
  const mutation = useGetNip65RelayListMutation();

  return (
    <Button variant="secondary" onClick={() => mutation.mutate()}>
      Get NIP-65 Relay List
    </Button>
  );
}
