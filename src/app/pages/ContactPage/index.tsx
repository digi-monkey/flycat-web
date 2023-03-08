import React, { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import {
  Event,
  EventSetMetadataContent,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  deserializeMetadata,
  RawEvent,
} from 'service/api';
import { connect } from 'react-redux';
import { Content } from '../../components/layout/msg/Content';
import { useParams } from 'react-router-dom';
import { shortPublicKey } from 'service/helper';
import { UserMap } from 'service/type';
import { useTranslation } from 'react-i18next';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { ProfileAvatar } from 'app/components/layout/msg/TextMsg';
import { ThinHr } from 'app/components/layout/ThinHr';
import { CallRelayType, WsConnectStatus } from 'service/worker/type';
import { Seen } from 'app/components/layout/msg/reaction/Seen';
import RestoreIcon from '@mui/icons-material/Restore';
import { CallWorker } from 'service/worker/callWorker';
import { SignEvent } from 'store/loginReducer';
import { useTimeSince } from 'hooks/useTimeSince';

export const styles = {
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
    display: 'block',
    width: '60px',
    height: '60px',
  },
  msgWord: {
    fontSize: '14px',
    display: 'block',
  },
  userName: {
    textDecoration: 'underline',
    marginRight: '5px',
  },
  time: {
    color: 'gray',
    fontSize: '12px',
    marginTop: '5px',
  },
  smallBtn: {
    fontSize: '12px',
    marginLeft: '5px',
    border: 'none' as const,
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
  userProfile: {
    padding: '10px',
  },
  userProfileAvatar: {
    width: '80px',
    height: '80px',
    marginRight: '10px',
  },
  userProfileName: {
    fontSize: '20px',
    fontWeight: '500',
  },
  userProfileBtnGroup: {
    marginTop: '20px',
  },
};

export type ContactList = Map<
  PublicKey,
  {
    relayer: RelayUrl;
    name: PetName;
  }
>;

interface UserParams {
  publicKey: string;
}

export type EventWithSeen = Event & { seen?: string[] };

export const ContactPage = ({ isLoggedIn, signEvent }) => {
  const { t } = useTranslation();
  const { publicKey } = useParams<UserParams>();

  const myPublicKey = useReadonlyMyPublicKey();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] =
    useState<{ keys: PublicKey[]; created_at: number }>();
  const [historyContacts, setHistoryContacts] = useState<EventWithSeen[]>([]);
  const [userContactList, setUserContactList] =
    useState<{ keys: PublicKey[]; created_at: number }>();

  const { worker, newConn, wsConnectStatus } = useCallWorker();

  const {
    worker: worker2,
    newConn: newConn2,
    wsConnectStatus: wsConnectStatus2,
  } = useCallWorker();

  useEffect(() => {
    if (newConn2.length === 0) return;

    worker2
      ?.subContactList([myPublicKey], undefined, undefined, {
        type: CallRelayType.batch,
        data: newConn2,
      })
      ?.iterating({ cb: handleEvent2 });
  }, [newConn2]);

  function handleEvent1(event: Event, relayUrl?: string) {
    console.log(event.kind);
    switch (event.kind) {
      case WellKnownEventKind.set_metadata:
        const metadata: EventSetMetadataContent = deserializeMetadata(
          event.content,
        );
        setUserMap(prev => {
          const newMap = new Map(prev);
          const oldData = newMap.get(event.pubkey);
          if (oldData && oldData.created_at > event.created_at) {
            // the new data is outdated
            return newMap;
          }

          newMap.set(event.pubkey, {
            ...metadata,
            ...{ created_at: event.created_at },
          });
          return newMap;
        });
        break;

      case WellKnownEventKind.contact_list:
        if (event.pubkey === myPublicKey) {
          setMyContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }

        if (event.pubkey === publicKey) {
          setUserContactList(prev => {
            if (prev && prev?.created_at >= event.created_at) {
              return prev;
            }

            const keys = (
              event.tags.filter(
                t => t[0] === EventTags.P,
              ) as EventContactListPTag[]
            ).map(t => t[1]);
            return {
              keys,
              created_at: event.created_at,
            };
          });
        }
        break;

      default:
        break;
    }
  }

  function handleEvent2(event: Event, relayUrl?: string) {
    switch (event.kind) {
      case WellKnownEventKind.contact_list:
        if (event.pubkey === myPublicKey) {
          setHistoryContacts(prev => {
            if (prev.map(p => p.id).includes(event.id)) {
              let data = prev;
              const index = data.findIndex(d => d.id === event.id);
              if (index === -1) return prev;

              if (!data[index].seen?.includes(relayUrl!)) {
                data[index].seen?.push(relayUrl!);
                return data;
              }

              return prev;
            }

            let data = [...prev, { ...event, ...{ seen: [relayUrl!] } }];
            data = data.sort((a, b) => (a.created_at >= b.created_at ? -1 : 1));
            return data;
          });
        }
        break;

      default:
        break;
    }
  }

  useEffect(() => {
    const pks = userContactList?.keys || [];
    //todo: validate publicKey
    if (publicKey.length > 0) {
      pks.push(publicKey);
    }
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    if (pks.length > 0) {
      worker
        ?.subMetaDataAndContactList(pks, undefined, undefined, {
          type: CallRelayType.batch,
          data: newConn || Array.from(wsConnectStatus.keys()),
        })
        ?.iterating({ cb: handleEvent1 });
    }
  }, [newConn, myPublicKey, userContactList?.keys.length]);

  return (
    <BaseLayout>
      <Left>
        <div style={styles.message}>
          <ul style={styles.msgsUl}>
            {isLoggedIn && (
              <div style={{ margin: '10px 0px' }}>
                <h4>{t('contact.historyFollowingTitle')}</h4>
                {historyContacts.map(c => (
                  <HistoryFollowing
                    event={c}
                    signEvent={signEvent}
                    worker={worker2}
                    wsConnectStatus={wsConnectStatus2}
                  />
                ))}
                <ThinHr />
              </div>
            )}

            <h4>
              {userMap.get(publicKey)?.name}
              {"'s "}
              {t('contact.currentFollowings')}
            </h4>
            {Array.from(userMap.entries())
              .filter(u => u[0] !== myPublicKey && u[0] !== publicKey)
              .map(([pk, user], index) => (
                <li key={index} style={styles.msgItem}>
                  <Grid container>
                    <Grid item xs={2}>
                      <ProfileAvatar picture={user.picture} name={user.name} />
                    </Grid>
                    <Grid item xs={10}>
                      <span style={styles.msgWord}>
                        <span>
                          <a style={styles.userName} href={'/user/' + pk}>
                            @{user.name || shortPublicKey(pk)}
                          </a>
                        </span>
                        <br />
                        <Content text={user.about || t('contact.noAbout')} />
                      </span>
                    </Grid>
                  </Grid>
                </li>
              ))}
          </ul>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(ContactPage);

const HistoryFollowing = ({
  event,
  signEvent,
  worker,
  wsConnectStatus,
}: {
  event: EventWithSeen;
  signEvent?: SignEvent;
  worker?: CallWorker;
  wsConnectStatus: WsConnectStatus;
}) => {
  const { t } = useTranslation();
  const recovery = async () => {
    let rawEvent = new RawEvent('', event.kind, event.tags, event.content);
    if (signEvent == null) {
      return alert('sign method is null!');
    }
    const newEvent = await signEvent(rawEvent);
    console.log('old event:', event, 'new Event: ', newEvent);
    if (worker == null) {
      return alert('worker is null, please re-try');
    }
    worker?.pubEvent(newEvent);
    alert(
      `send to ${
        Array.from(wsConnectStatus.keys()).length
      } relays. please try refresh the page!`,
    );
  };

  return (
    <div style={{ padding: '10px 0px' }}>
      <span style={{ display: 'block' }}>
        {event.tags.length} -{' '}
        <span style={{ fontSize: '12px', color: 'gray' }}>
          {useTimeSince(event.created_at)}
        </span>
      </span>
      <Seen
        seen={event.seen!}
        relays={Array.from(wsConnectStatus.keys())}
        worker={worker!}
        event={event}
      />
      <button
        style={{
          background: 'none',
          border: 'none',
          fontSize: '14px',
          color: 'gray',
        }}
        onClick={recovery}
      >
        <RestoreIcon style={{ color: 'gray', fontSize: '14px' }} />{' '}
        {t('contact.recoveryBtn')}
      </button>
    </div>
  );
};
