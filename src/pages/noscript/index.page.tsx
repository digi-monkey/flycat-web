import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Upload } from "antd";
import { BaseLayout, Left } from "components/BaseLayout";
import PageTitle from "components/PageTitle";
import { noticePubEventResult } from "components/PubEventNotice";
import { Nip188 } from "core/nip/188";
import { useReadonlyMyPublicKey } from "hooks/useMyPublicKey";
import { useCallWorker } from "hooks/useWorker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import styles from './index.module.scss';

export function NoscriptManger() {
  const identifire = "wasm:profile:get_string";

  const { worker, newConn } = useCallWorker();
  const myPublicKey = useReadonlyMyPublicKey();
  const signEvent = useSelector(
    (state: RootState) => state.loginReducer.signEvent,
  );

  const customRequest = async ({ file, onSuccess, onError }) => {
    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (!signEvent || !worker) {
        const err = new Error("signEvent or worker is undefined.")
        onError(err);
        message.error(err.message);
        return;
      }
      try {
        if (event.target && event.target.result instanceof ArrayBuffer) {
          const arrayBuffer = event.target.result;
          const codeStr = Nip188.arrayBufferToBase64(arrayBuffer);
          console.log("wasm code str: ", codeStr);
          const rawEvent = Nip188.createNoscript(arrayBuffer, identifire);
          const pubEvent = await signEvent(rawEvent);
          const handler = worker.pubEvent(pubEvent);
          noticePubEventResult(handler);
          onSuccess();
          message.success(`${file.name} file uploaded and read successfully`);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        onError(error);
        message.error(`${file.name} file upload failed.`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return <BaseLayout>
    <Left>
      <PageTitle title="Nostr Scripts(wasm)" />
      <div className={styles.root}>
        <h4>Profile Answering Scripts</h4>
        <Upload customRequest={customRequest as any}>
          <Button icon={<UploadOutlined />}>upload .wasm file</Button>
        </Upload>
      </div>
    </Left>
  </BaseLayout>
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale, ['common'])),
  },
});

export default NoscriptManger;
