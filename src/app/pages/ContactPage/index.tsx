import React, { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import {
  Event,
  EventSubResponse,
  EventSetMetadataContent,
  isEventSubResponse,
  WellKnownEventKind,
  PublicKey,
  RelayUrl,
  PetName,
  EventTags,
  EventContactListPTag,
  deserializeMetadata,
} from 'service/api';
import { connect } from 'react-redux';
import RelayManager from '../../components/layout/relay/RelayManager';
import { Content } from '../../components/layout/msg/Content';
import { useParams } from 'react-router-dom';
import { shortPublicKey } from 'service/helper';
import { UserMap } from 'service/type';
import { UserBox } from 'app/components/layout/UserBox';
import { useTranslation } from 'react-i18next';
import { BaseLayout, Left, Right } from 'app/components/layout/BaseLayout';
import { loginMapStateToProps } from 'app/helper';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { useCallWorker } from 'hooks/useWorker';
import { ProfileAvatar } from 'app/components/layout/msg/TextMsg';

// don't move to useState inside components
// it will trigger more times unnecessary
let myContactEvent: Event;
let userContactEvent: Event;

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

export const ContactPage = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const { publicKey } = useParams<UserParams>();

  const myPublicKey = useReadonlyMyPublicKey();

  const [userMap, setUserMap] = useState<UserMap>(new Map());
  const [myContactList, setMyContactList] = useState<ContactList>(new Map());
  const [userContactList, setUserContactList] = useState<ContactList>(
    new Map(),
  );

  const updateWorkerMsgListenerDeps = [
    myPublicKey,
    myContactEvent,
    userContactEvent,
  ];
  const { worker, newConn, wsConnectStatus } = useCallWorker({
    onMsgHandler,
    updateWorkerMsgListenerDeps,
  });

  function onMsgHandler(res: any) {
    const msg = JSON.parse(res);
    if (isEventSubResponse(msg)) {
      const event = (msg as EventSubResponse)[2];
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
            if (
              myContactEvent == null ||
              myContactEvent?.created_at! < event.created_at
            ) {
              myContactEvent = event;
            }
          }

          if (event.pubkey === publicKey) {
            if (
              userContactEvent == null ||
              userContactEvent?.created_at! < event.created_at
            ) {
              userContactEvent = event;
            }
          }
          break;

        default:
          break;
      }
    }
  }

  useEffect(() => {
    if (myContactEvent == null) return;

    const contacts = myContactEvent.tags.filter(
      t => t[0] === EventTags.P,
    ) as EventContactListPTag[];

    let cList: ContactList = new Map(myContactList);

    contacts.forEach(c => {
      const pk = c[1];
      const relayer = c[2];
      const name = c[3];
      if (!cList.has(pk)) {
        cList.set(pk, {
          relayer,
          name,
        });
      }
    });

    setMyContactList(cList);
  }, [myContactEvent]);

  useEffect(() => {
    if (userContactEvent == null) return;

    const contacts = userContactEvent.tags.filter(
      t => t[0] === EventTags.P,
    ) as EventContactListPTag[];

    let cList: ContactList = new Map(userContactList);

    contacts.forEach(c => {
      const pk = c[1];
      const relayer = c[2];
      const name = c[3];
      if (!cList.has(pk)) {
        cList.set(pk, {
          relayer,
          name,
        });
      }
    });

    setUserContactList(cList);
  }, [userContactEvent]);

  useEffect(() => {
    const pks = Array.from(userContactList.keys());
    //todo: validate publicKey
    if (publicKey.length > 0) {
      pks.push(publicKey);
    }
    if (isLoggedIn && myPublicKey.length > 0) {
      pks.push(myPublicKey);
    }

    if (pks.length > 0) {
      worker?.subMetaDataAndContactList(pks);
    }
  }, [newConn, myPublicKey, userContactList.size]);

  return (
    <BaseLayout>
      <Left>
        <div style={styles.message}>
          <ul style={styles.msgsUl}>
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
      <Right>
        <UserBox
          pk={publicKey}
          name={userMap.get(publicKey)?.name}
          about={userMap.get(publicKey)?.about}
          avatar={userMap.get(publicKey)?.picture}
          followCount={userContactList.size}
        />
        <hr />
        <RelayManager />
      </Right>
    </BaseLayout>
  );
};

export default connect(loginMapStateToProps)(ContactPage);
