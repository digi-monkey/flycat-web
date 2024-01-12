import { Button } from 'components/shared/ui/Button';
import useFindAutoRelayListMutation from '../hooks/useFindAutoRelayListMutation';

export default function FindAutoRelayButton() {
  const mutation = useFindAutoRelayListMutation();

  return (
    <Button variant="secondary" onClick={() => mutation.mutate()}>
      Find Auto Relay List For Me
    </Button>
  );
}
