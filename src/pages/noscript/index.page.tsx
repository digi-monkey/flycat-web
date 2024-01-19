import { BaseLayout, Left, Right } from 'components/BaseLayout';
import { WasmFileUpload } from './upload';
import { useCallWorker } from 'hooks/useWorker';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Nip188 } from 'core/nip/188';
import { useEffect, useState } from 'react';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';
import { Input } from 'antd';
import { Filter } from 'core/nostr/type';
import { validateFilter } from 'components/TimelineRender/util';

import styles from './index.module.scss';
import PageTitle from 'components/PageTitle';
import Link from 'next/link';

export function NoscriptManger() {
  const profileIdentifier = 'wasm:profile:get_string';
  const filterIdentifier = 'wasm:msg:filter';
  const profileBtnText = 'upload profile .wasm file';
  const filterBtnText = 'upload custom filter .wasm file';

  const myPublicKey = useReadonlyMyPublicKey();

  const { worker } = useCallWorker();

  const findFilterNoscript = async () => {
    if (!myPublicKey) return;
    if (!worker) return;

    const filter = Nip188.createQueryNoscriptFilter([myPublicKey], 1);
    console.log('filter', filter);
    worker.subFilter({ filter }).iterating({
      cb: (event, relay) => {
        console.log('get event: ', event, relay);
      },
    });
  };

  useEffect(() => {
    findFilterNoscript();
  }, [myPublicKey, worker]);

  const [inputFilter, setInputFilter] = useState<Filter>();
  const [msgFilterScriptId, setMsgFilterScriptId] = useState<string>();
  const [msgFilterScriptDescription, setMsgFilterScriptDescription] =
    useState<string>();
  const isDisabled =
    !inputFilter || !validateFilter(inputFilter) || !msgFilterScriptId;

  const handleInputFilterChange = e => {
    const filterStr = e.target.value;
    try {
      const filter = JSON.parse(filterStr);
      if (validateFilter(filter)) {
        setInputFilter(filter);
      } else {
        setInputFilter(undefined);
      }
    } catch (error: any) {
      console.error(error.message);
      setInputFilter(undefined);
    }
  };

  return (
    <BaseLayout>
      <Left>
        <PageTitle title="Nostr Scripts(experiment)" />
        <div className={styles.root}>
          {/*
          <h4>Profile Answering Scripts</h4>
          <WasmFileUpload
            identifier={profileIdentifier}
            worker={worker}
            btnText={profileBtnText}
          />
          */}

          <div style={{ color: 'gray', marginBottom: '10px' }}>
            This is a experiment feature. A nostr script is just a piece of wasm
            bytecode stored on relay, composed by users instead of flycat or any
            other platforms/clients. You can put arbitrary logic on the nostr
            script. Below is a simple use case, costuming a timeline via nostr
            scripts.
          </div>

          <h4>Custom Timeline Scripts</h4>
          <Input
            placeholder="script id(the d tag)"
            onChange={e => setMsgFilterScriptId(e.target.value)}
          />
          <Input
            placeholder="script description, what is your script about"
            onChange={e => setMsgFilterScriptDescription(e.target.value)}
          />
          <Input.TextArea
            placeholder="paste filter json here"
            autoSize={{ minRows: 6, maxRows: 10 }}
            onChange={handleInputFilterChange}
          />
          <WasmFileUpload
            identifier={msgFilterScriptId || ''}
            worker={worker}
            btnText={filterBtnText}
            disabled={isDisabled}
            extraTags={Nip188.createNoscriptMsgFilterTag(
              inputFilter || {},
              msgFilterScriptDescription,
            )}
          />
          <p>
            How to create a script? Check out{' '}
            <Link href="https://github.com/digi-monkey/flycat-web/blob/master/docs/noscript.md#custom-timeline-script">
              here
            </Link>
          </p>
        </div>
      </Left>
      <Right></Right>
    </BaseLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default NoscriptManger;
