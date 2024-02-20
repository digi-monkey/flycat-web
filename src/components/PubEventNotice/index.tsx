import { PubEventResultStream } from 'core/worker/sub';
import { PubEventResultMsg } from 'core/worker/type';
import { toast as Toast } from 'components/shared/ui/Toast/use-toast';
import { PublishNotice } from 'components/shared/PublishNotice';

export async function noticePubEventResult(
  toast: typeof Toast,
  relayCount: number,
  pubStream: PubEventResultStream,
  successCb?: (eventId: string, successRelays: string[]) => any,
) {
  toast({
    title: `Publish event to ${0}/${relayCount} relays`,
    status: 'loading',
    duration: 60000,
  });

  const exec = async () => {
    let index = 0;
    const pubResult: PubEventResultMsg[] = [];
    for await (const result of pubStream) {
      pubResult.push(result);

      // update ui
      index++;
      toast({
        title: `Publish event to ${index}/${relayCount} relays`,
        status: 'loading',
      });
    }
    pubStream.unsubscribe();

    const successRelays = pubResult
      .filter(r => r.isSuccess)
      .map(r => r.relayUrl);
    if (successRelays.length > 0 && successCb) {
      successCb(pubStream.eventId, successRelays);
    }
    return pubResult;
  };

  const pubResult = await exec();

  const success = pubResult.filter(res => res.isSuccess).map(r => r.relayUrl);
  const fail = pubResult
    .filter(res => !res.isSuccess)
    .map(res => {
      return { relay: res.relayUrl, reason: res.reason || 'unknown reason' };
    });
  const content = <PublishNotice success={success} fail={fail} />;

  toast({
    customContent: content,
    status: 'success',
  });
}
