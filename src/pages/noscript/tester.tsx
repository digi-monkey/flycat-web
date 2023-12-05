import { Button, message, Upload } from "antd";
import Icon from "components/Icon";

export interface WasmFileTesterdProp {
  btnText?: string;
  testFn: (byteCode: ArrayBuffer) => Promise<any>
}

export const WasmFileTester: React.FC<WasmFileTesterdProp> = ({ btnText, testFn }) => {
  const customRequest = async ({ file, onSuccess, onError }) => {
    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      try {
        if (event.target && event.target.result instanceof ArrayBuffer) {
          const arrayBuffer = event.target.result;
          await testFn(arrayBuffer);
          onSuccess();
          message.success(`${file.name} file uploaded and test successfully`);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        onError(error);
        message.error(`${file.name} file test failed.`);
      }
    };

    reader.readAsArrayBuffer(file);
  };
  return <Upload customRequest={customRequest as any}>
    <Button icon={<Icon type="icon-plus" />}>{btnText || "upload .wasm file"}</Button>
  </Upload>
}
