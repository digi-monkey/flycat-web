import { Modal, message } from 'antd';
import { PubEventResultStream } from 'core/worker/sub';
import { shortifyEventId } from 'core/nostr/content';
import { CopyText } from 'components/CopyText/CopyText';

import styles from './index.module.scss';
import { PubEventResultMsg } from 'core/worker/type';

export async function noticePubEventResult(
  handler: PubEventResultStream,
  successCb?: (eventId: string, successRelays: string[]) => any,
  lightMode = true,
) {
  const exec = async () => {
    const pubResult: PubEventResultMsg[] = [];
    const result: React.JSX.Element[] = [];
    for await (const h of handler) {
      pubResult.push(h);
      const item = (
        <li key={h.relayUrl} className={styles.item}>
          <span>{h.relayUrl}</span>
          <span className={h.isSuccess ? styles.success : styles.failed}>
            {h.isSuccess && 'success'}
            {!h.isSuccess && h.reason}
          </span>
        </li>
      );
      result.push(item);
    }
    handler.unsubscribe();

    const successRelays = pubResult
      .filter(r => r.isSuccess)
      .map(r => r.relayUrl);
    if (successRelays.length > 0 && successCb) {
      successCb(handler.eventId, successRelays);
    }
    return result;
  };

  if (!lightMode) {
    let secondsPassed = 0;

    const instance = Modal.success({
      title: 'Publishing Events..',
      content: `wait for ${secondsPassed} second..`,
    });
    const timer = setInterval(() => {
      secondsPassed += 1;
      instance.update({
        content: `wait for ${secondsPassed} second..`,
      });
    }, 1000);

    const result = await exec();

    //close the waiting
    clearInterval(timer);
    instance.update({
      title: 'Published Event',
      content: (
        <div>
          <div className={styles.eventId}>
            event@{shortifyEventId(handler.eventId)}{' '}
            <CopyText name={'Copy Event Id'} textToCopy={handler.eventId} />
          </div>
          <div>{result}</div>
        </div>
      ),
    });
  } else {
    // todo: use messageApi
    message.info('Publishing Events..');

    const result = await exec();

    const content = (
      <div>
        <h2>Published Event</h2>
        <div className={styles.eventId}>
          event@{shortifyEventId(handler.eventId)}{' '}
          <CopyText name={'Copy Event Id'} textToCopy={handler.eventId} />
        </div>
        <div>{result}</div>
      </div>
    );
    message.info(content);
  }
}
