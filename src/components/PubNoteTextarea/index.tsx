import { Paths } from 'constants/path';
import { Nip19 } from 'core/nip/19';
import { connect } from 'react-redux';
import { useRouter } from 'next/router';
import { useCallWorker } from 'hooks/useWorker';
import { useTranslation } from 'next-i18next';
import { useRef, useState } from 'react';
import { LoginMode, SignEvent } from 'store/loginReducer';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Button, Mentions, Popover, Tooltip } from 'antd';
import { handleFileSelect, handleSubmitText } from './util';
import { IMentions, useLoadContacts, useSetMentions, useSetRelays } from './hooks';

import Link from 'next/link';
import Icon from 'components/Icon';
import React from 'react';
import styles from './index.module.scss';
import Picker from '@emoji-mart/react';
import emojiData from '@emoji-mart/data'
import classNames from 'classnames';

interface Props {
  isLoggedIn: boolean;
  mode: LoginMode;  
  signEvent?: SignEvent;
}

export const SubmitButton = ({ disabled }: { disabled: boolean }) => {
  const { t } = useTranslation();
  return <Button disabled={disabled} type='primary' htmlType="submit">{t('pubNoteTextarea.btn.post')}</Button>;
}

const PubNoteTextarea: React.FC<Props> = ({ isLoggedIn, signEvent }) => {
  const router = useRouter();
  const myPublicKey = useReadonlyMyPublicKey();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation();
  const { worker } = useCallWorker();
  const [text, setText] = useState('');
  const [relays, setRelays] = useState<string[]>([]);
  const [attachImgs, setAttachImgs] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mentionValue, setMentionsValue] = useState<IMentions[]>([]);
  const [selectMention, setSelectMention] = useState({});
  const [mentionsFocus, setMentionsFocus] = useState(false);

  const { userMap } = useLoadContacts();
  useSetMentions(setMentionsValue, userMap);
  useSetRelays(setRelays);

  return (
    <div className={classNames(styles.pubNoteTextarea, {
      [styles.focus]: mentionsFocus
    })}>
      <form 
        onSubmit={event => handleSubmitText(
          event,
          text,
          attachImgs,
          setText,
          setAttachImgs,
          selectMention,
          signEvent,
          myPublicKey,
          worker
        )}
      >
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
            <Tooltip placement="top" title={t('pubNoteTextarea.icons.image')}>
              <Icon type='icon-image' onClick={() => fileInputRef.current && fileInputRef.current.click()} className={styles.upload} />
            </Tooltip>
            <input type="file" ref={fileInputRef} onChange={event => handleFileSelect(event, setIsUploading, setAttachImgs)} />
            <Popover placement="bottom" title={text} content={
              <Picker data={emojiData} onEmojiSelect={res => setText(text + res.native)} locale={router.locale} />
            }>
              <Tooltip placement="top" title={t('pubNoteTextarea.icons.emoji')}>
                <Icon type="icon-emoji" className={styles.emoji} />
              </Tooltip>
            </Popover>
            <Tooltip placement="top" title={t('pubNoteTextarea.icons.longForm')}>
              <Link href={Paths.write} passHref>
                <Icon type="icon-article" className={styles.article} />
              </Link>
            </Tooltip>
          </div>
          <SubmitButton disabled={text.length === 0 || isUploading || !isLoggedIn || isLoggedIn && signEvent == null} />
        </div>
      </form>
    </div>
  );
};

const mapStateToProps = state => ({
  isLoggedIn: state.loginReducer.isLoggedIn,
  mode: state.loginReducer.mode,
  signEvent: state.loginReducer.signEvent,
  publicKey: state.loginReducer.publicKey,
  privateKey: state.loginReducer.privateKey,
});
export default connect(mapStateToProps)(PubNoteTextarea);
