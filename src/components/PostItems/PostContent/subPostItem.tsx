import { Avatar } from "antd";
import { dexieDb } from "core/db";
import { Nip23 } from "core/nip/23";
import { Event } from "core/nostr/Event";
import { shortifyPublicKey } from "core/nostr/content";
import { EventSetMetadataContent } from "core/nostr/type";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { maxStrings } from "utils/common";
import { MediaPreviews } from "./Media";

import styles from './index.module.scss';
import PostArticle from "../PostArticle";

export interface SubPostItemProp {
  event: Event;
}

export const SubPostItem: React.FC<SubPostItemProp> = ({ event }) => {
  const router = useRouter();
  const clickUserProfile = () => {
    router.push(`/user/${event.pubkey}`);
  };
  const clickEventBody = () => {
    router.push(`/event/${event.id}`);
  };

  const [loadedUserProfile, setLoadedUserProfile] =
    useState<EventSetMetadataContent>();
  const loadUserProfile = async () => {
    // todo: set relay urls with correct one
    const profileEvent = await dexieDb.profileEvent.get(event.pubkey);
    if (profileEvent) {
      const metadata = JSON.parse(
        profileEvent.content,
      ) as EventSetMetadataContent;
      setLoadedUserProfile(metadata);
    }
  };
  useEffect(() => {
    loadUserProfile();
  }, [event]);

  return Nip23.isBlogPost(event) ? (
    <PostArticle
      userAvatar={loadedUserProfile?.picture || ''}
      userName={loadedUserProfile?.name || ''}
      event={event}
      key={event.id}
    />
  ) : (
    <div className={styles.replyEvent}>
      <div className={styles.user} onClick={clickUserProfile}>
        <Avatar src={loadedUserProfile?.picture} alt="picture" />
        <span className={styles.name}>
          {loadedUserProfile?.name || shortifyPublicKey(event.pubkey)}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.event} onClick={clickEventBody}>
          {maxStrings(event.content, 150)}
        </div>
        <MediaPreviews content={event.content} />
      </div>
    </div>
  );
};
