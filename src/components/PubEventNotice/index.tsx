import { Collapse, Modal, Progress, message } from 'antd';
import { PubEventResultStream } from 'core/worker/sub';
import { PubEventResultMsg } from 'core/worker/type';

import styles from './index.module.scss';
import Link from 'next/link';
import Icon from 'components/Icon';

const { Panel } = Collapse;

export async function noticePubEventResult(
  relayCount: number,
  pubStream: PubEventResultStream,
  successCb?: (eventId: string, successRelays: string[]) => any,
) {
  const instance = Modal.info({
    title: `Publish event to ${0}/${relayCount} relays`,
    icon: null,
    content: (
      <Progress percent={calculatePercentage(0, relayCount)} showInfo={false} />
    ),
    okButtonProps: { style: { display: 'none' } },
  });

  const exec = async () => {
    let index = 0;
    const pubResult: PubEventResultMsg[] = [];
    for await (const result of pubStream) {
      pubResult.push(result);

      // update ui
      index++;
      instance.update({
        title: `Publish event to ${index}/${relayCount} relays`,
        icon: null,
        content: (
          <Progress
            percent={calculatePercentage(index, relayCount)}
            showInfo={false}
          />
        ),
        okButtonProps: { style: { display: 'none' } },
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

  instance.destroy();
  const key = 'pub-result';
  message.info({
    key,
    icon: <span></span>,
    content: (
      <div className={styles.messageContainer}>
        <div className={styles.title}>
          <h3>
            Publish <Link href={'/event/' + pubStream.eventId}>note</Link> to {relayCount}{' '}
            relays
          </h3>
          <button
            onClick={() => message.destroy(key)}
            className={styles.closeButton}
          >
            <Icon type="icon-cross" width={24} height={24} />
          </button>
        </div>

        <div className={styles.eventId}></div>
        <Collapse>
          <Panel header="Expand relay detail" key="1">
            <div>
              {pubResult
                .filter(res => res.isSuccess)
                .map(res => {
                  return (
                    <li key={res.relayUrl} className={styles.item}>
                      <span className={styles.success}>
                        <span>{res.relayUrl}</span>
                        <span>{'☑️'}</span>
                      </span>
                    </li>
                  );
                })}
              <hr />
              {pubResult
                .filter(res => !res.isSuccess)
                .map(res => {
                  return (
                    <li key={res.relayUrl} className={styles.item}>
                      <span className={styles.failed}>
                        <span>{res.relayUrl}</span>
                        <span>{res.reason}</span>
                      </span>
                    </li>
                  );
                })}
            </div>
          </Panel>
        </Collapse>
      </div>
    ),
  });
}

function calculatePercentage(finishedCount: number, totalCount: number) {
  if (totalCount === 0) {
    throw new Error('Cannot calculate percentage with total count of 0.');
  }
  let percentage = (finishedCount / totalCount) * 100;
  percentage = +percentage.toFixed(0);
  return percentage;
}
