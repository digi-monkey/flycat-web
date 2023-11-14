import { Collapse, Modal, Progress } from 'antd';
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

  

  instance.update({
    title: `Publish event to ${relayCount} relays`,
    content: (
      <div>
        <div className={styles.eventId}>
          <Link href={'/event/' + pubStream.eventId}>view full note</Link>
        </div>
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
        <button
          onClick={() => Modal.destroyAll()}
          className={styles.closeButton}
        >
          <Icon type="icon-cross" width={24} height={24} />
        </button>
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

export async function testNotice() {
  const relayCount = 7;
  const instance = Modal.info({
    title: `Publish event to ${4}/${relayCount} relays`,
    icon: null,
    content: (
      <Progress percent={calculatePercentage(4, relayCount)} showInfo={false} />
    ),
    okButtonProps: { style: { display: 'none' } },
  });

  const eventId = '0xfekdasfjjsjdf12';
  const pubResult = [
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: false,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: true,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: true,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: false,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: true,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relaymkkpllllllllkkoioiiiiiii1.com',
      isSuccess: false,
      reason: 'no active subscription',
    },
    {
      relayUrl: 'wss://relay1.com',
      isSuccess: false,
      reason: 'invalid event kind',
    },
  ];

  instance.update({
    title: `Publish event to ${relayCount} relays`,
    content: (
      <div>
        <div className={styles.eventId}>
          <Link href={'/event/' + eventId}>view full note</Link>
        </div>
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
        <button
          onClick={() => Modal.destroyAll()}
          className={styles.closeButton}
        >
          <Icon type="icon-cross" width={24} height={24} />
        </button>
      </div>
    ),
  });
}
