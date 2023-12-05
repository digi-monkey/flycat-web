import { Button, message, Upload } from "antd";
import Icon from "components/Icon";
import { noticePubEventResult } from "components/PubEventNotice";
import { Nip188 } from "core/nip/188";
import { Tags } from "core/nostr/type";
import { CallWorker } from "core/worker/caller";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";

export interface WasmFileUploadProp {
  identifier: string;
  extraTags?: Tags;
  worker: CallWorker | undefined;
  btnText?: string;
  disabled?: boolean;
}

export const WasmFileUpload: React.FC<WasmFileUploadProp> = ({ identifier, worker, btnText, extraTags, disabled }) => {
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
          console.debug("wasm code str: ", codeStr);
          const rawEvent = Nip188.createNoscript(arrayBuffer, identifier, extraTags);
          console.log("raw event:", rawEvent);
          const pubEvent = await signEvent(rawEvent);
          const handler = worker.pubEvent(pubEvent);
          noticePubEventResult(worker.relays.length, handler);
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
  return <Upload customRequest={customRequest as any} disabled={disabled === true}>
    <Button icon={<Icon type="icon-plus" />}>{disabled ? "please fill the above filter first" : btnText || "upload .wasm file"} {disabled}</Button>
  </Upload>
}
