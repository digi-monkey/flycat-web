import { useCallWorker } from 'hooks/useWorker';
import React, { useEffect, useState } from 'react';
import Calendar from 'react-github-contribution-calendar';
import { Event, WellKnownEventKind } from 'service/api';
import { CallRelayType } from 'service/worker/type';

var panelColors = ['#EEEEEE', '#D6E685', '#8CC665', '#44A340', '#1E6823'];
var panelAttributes = { rx: 6, ry: 6 };
var weekNames = ['s', 'm', 't', 'w', 't', 'f', 's'];
var monthNames = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
];

interface LightMsgList {
  created_at: number;
  id: string;
}

export function CommitCalendar({ pk }: { pk: string }) {
  const until = toDateString(Date.now() / 1000);
  const [msgList, setMsgList] = useState<LightMsgList[]>([]); //seconds
  const [values, setValues] = useState<any>([]);

  function handleEvent(event: Event, relayUrl?: string) {
    if (event.pubkey !== pk) {
      return;
    }

    if (event.kind === WellKnownEventKind.text_note) {
      setMsgList(prev => {
        if (!prev.map(p => p.id).includes(event.id)) {
          return [...prev, { created_at: event.created_at, id: event.id }];
        }
        return prev;
      });
    }
  }

  const { worker, newConn } = useCallWorker();

  useEffect(() => {
    if (newConn.length === 0) return;

    worker
      ?.subMsg(
        [pk],
        undefined,
        undefined,
        {
          type: CallRelayType.batch,
          data: newConn,
        },
        { limit: 1000 },
      )
      ?.iterating({ cb: handleEvent });
  }, [newConn]);

  useEffect(() => {
    if (msgList.length > 0) {
      const values = getCommitCountByDay(msgList);
      setValues(values);
    }
  }, [msgList]);

  return (
    <div>
      <Calendar
        values={values}
        until={until}
        panelAttributes={panelAttributes}
        panelColors={panelColors}
        weekLabelAttributes={weekNames}
        monthLabelAttributes={monthNames}
      />
    </div>
  );
}

function getCommitCountByDay(msgList: LightMsgList[]): any {
  const values: any = {};
  for (let i = 0; i < msgList.length; i++) {
    const msg = msgList[i];
    const dateString = toDateString(msg.created_at);
    if (dateString in values) {
      values[dateString]++;
    } else {
      values[dateString] = 1;
    }
  }
  return values;
}

function toDateString(secs: number) {
  const date = new Date(secs * 1000); // Convert timestamp to Date object
  const dateString = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
  return dateString;
}

function pad(num) {
  return num < 10 ? `0${num}` : num.toString();
}
