import { Popover } from '@mui/material';
import React from 'react';
import { useTranslation } from 'next-i18next';
import { CallWorker } from 'service/worker/callWorker';
import { CallRelayType } from 'service/worker/type';
import { Event } from 'service/api';
import BroadcastOnPersonalIcon from '@mui/icons-material/BroadcastOnPersonal';

const styles = {
  root: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  title: {
    color: 'black',
    fontSize: '2em',
    fontWeight: '380',
    diplay: 'block',
    width: '100%',
    margin: '5px',
  },
  ul: {
    padding: '10px',
    background: 'white',
    borderRadius: '5px',
  },
  li: {
    display: 'inline',
    padding: '10px',
  },
  content: {
    margin: '5px 0px',
    minHeight: '700px',
    background: 'white',
    borderRadius: '5px',
  },
  left: {
    height: '100%',
    minHeight: '700px',
    padding: '20px',
  },
  right: {
    minHeight: '700px',
    backgroundColor: '#E1D7C6',
    padding: '20px',
  },
  postBox: {},
  postHintText: {
    color: '#acdae5',
    marginBottom: '5px',
  },
  postTextArea: {
    resize: 'none' as const,
    boxShadow: 'inset 0 0 1px #aaa',
    border: '1px solid #b9bcbe',
    width: '100%',
    height: '80px',
    fontSize: '14px',
    padding: '5px',
    overflow: 'auto',
  },
  btn: {
    display: 'box',
    textAlign: 'right' as const,
  },
  message: {
    marginTop: '5px',
  },
  msgsUl: {
    padding: '5px',
  },
  msgItem: {
    display: 'block',
    borderBottom: '1px dashed #ddd',
    padding: '15px 0',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    maxWidth: '100%',
  },
  msgWord: {
    fontSize: '14px',
    display: 'block',
  },
  userName: {
    //textDecoration: 'underline',
    color: 'black',
    fontSize: '15px',
    fontWeight: '500',
    marginRight: '5px',
  },
  time: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  reaction: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  smallBtn: {
    fontSize: '12px',
    //marginLeft: '5px',
    border: 'none' as const,
    background: 'none',
  },
  connected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'green',
  },
  disconnected: {
    fontSize: '18px',
    fontWeight: '500',
    color: 'red',
  },
  userProfileAvatar: {
    width: '60px',
    height: '60px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
};

export interface SeenProps {
  seen: string[];
  relays: string[];
  event: Event;
  worker: CallWorker;
}
export function Seen({ seen, relays, event, worker }: SeenProps) {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <span style={styles.reaction} onClick={handleClick}>
        {seen.map(url => (
          <span key={url} style={{ color: 'green' }}>
            |
          </span>
        ))}
        {relays
          ?.filter(r => !seen?.includes(r))
          .map(url => (
            <span key={url} style={{ color: '#c6c0c0' }}>
              |
            </span>
          ))}
      </span>
      <Popover
        id={'popup:' + event.id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '10px', fontSize: '14px', width: '100%' }}>
          <div style={{ display: 'block' }}>{t('seen.title')}</div>
          <div>
            {seen &&
              seen.length > 0 &&
              seen
                ?.filter(url => url != null && url !== '')
                .map(url => <li key={url}>{url}</li>)}
          </div>

          <button
            style={{ width: '100%', marginTop: '10px' }}
            onClick={() => {
              const pubToRelays =
                relays?.filter(r => !seen?.includes(r)).map(url => url) || [];
              if (pubToRelays.length > 0) {
                worker.pubEvent(event, {
                  type: CallRelayType.batch,
                  data: pubToRelays,
                });
                alert(
                  `broadcast to ${pubToRelays.length} relays, please refresh page!`,
                );
              }
            }}
          >
            <BroadcastOnPersonalIcon /> {t('seen.broadcast')}
          </button>
        </div>
      </Popover>
    </>
  );
}
