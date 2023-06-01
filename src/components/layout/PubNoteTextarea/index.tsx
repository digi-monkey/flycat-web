import { Nip19 } from 'service/nip/19';
import { UserMap } from 'service/type';
import { useRouter } from 'next/router';
import { LoginMode } from 'store/loginReducer';
import { PublicKey } from 'service/api';
import { useTranslation } from 'next-i18next';
import { useRef, useState } from 'react';
import { Button, Mentions, Popover, Tooltip } from 'antd';
import { IMentions, useSetMentions, useSetRelays } from './hooks';
import { handleFileSelect, handleSubmitText, makeInvoice } from './util';
import { SmileOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';

import React from 'react';
import Icon from 'components/Icon';
import styles from './index.module.scss';
import Picker from '@emoji-mart/react'
import emojiData from '@emoji-mart/data'
import classNames from 'classnames';
import Link from 'next/link';
import { Paths } from 'constants/path';

interface Props {
  disabled: boolean;
  mode: LoginMode;
  onSubmitText: (text: string) => Promise<any>;
  userContactList?: { keys: PublicKey[]; created_at: number };
  userMap: UserMap;
}

export const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  return <Button disabled={disabled} type='primary' htmlType="submit">Post</Button>;
}

export const PubNoteTextarea: React.FC<Props> = ({ disabled, mode, onSubmitText, userMap, userContactList }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [relays, setRelays] = useState<string[]>([]);
  const [attachImgs, setAttachImgs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mentionValue, setMentionsValue] = useState<IMentions[]>([]);
  const [selectMention, setSelectMention] = useState({});
  const [mentionsFocus, setMentionsFocus] = useState(false);

  useSetMentions(setMentionsValue, userMap);
  useSetRelays(setRelays);

  return (
    <div className={classNames(styles.pubNoteTextarea, {
      [styles.focus]: mentionsFocus
    })}>
      <form onSubmit={event => handleSubmitText(event, text, attachImgs, setText, setAttachImgs, onSubmitText, selectMention)}>
        <Mentions
          rows={3}
          placeholder={t('pubNoteBox.hintText') || ''}
          className={styles.postTextArea}
          value={text}
          onChange={value => setText(value)}
          onSelect={({key, value}) => setSelectMention({ [value || '']: Nip19.encodeNprofile({pubkey: key ?? '', relays}), ...selectMention })}
          options={mentionValue}
          onFocus={() => setMentionsFocus(true)}
          // onBlur={() => setMentionsFocus(false)}
        />
        { attachImgs.length > 0 && (
            <div className={styles.imgs}>
              { attachImgs.map((url, key) => (
                  <div className={styles.imgItem} key={key}>
                    <img src={url} key={key} alt="img" />
                    <Icon type='icon-cross' onClick={() => setAttachImgs(attachImgs.filter((_, index) => index !== key))} />
                  </div>
                )
              )}
            </div>  
          )
        }
        <div 
          className={classNames(styles.btn, {
            [styles.focus]: mentionsFocus
          })}
        >
          <div className={styles.icons}>
            <Tooltip placement="top" title={"Insert image"}>
              <Icon type='icon-image' onClick={() => fileInputRef.current && fileInputRef.current.click()} className={styles.upload} />
            </Tooltip>
            <input type="file" ref={fileInputRef} onChange={event => handleFileSelect(event, setIsUploading, setAttachImgs)} />
            <Popover placement="bottom" title={text} content={
              <Picker data={emojiData} onEmojiSelect={res => setText(text + res.native)} locale={router.locale} />
            }>
              <Tooltip placement="top" title={"Insert emoji"}>
                <Icon type="icon-emoji" className={styles.emoji} />
              </Tooltip>
            </Popover>
            <Tooltip placement="top" title={"Write long-form"}>
              <Link href={Paths.write} passHref>
                <Icon type="icon-article" className={styles.article} />
              </Link>
            </Tooltip>
          </div>
          <SubmitButton disabled={disabled} />
        </div>
      </form>
    </div>
  );
};
