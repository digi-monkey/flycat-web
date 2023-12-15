import { message } from 'antd';

export interface CopyTextProps {
  name: string;
  textToCopy?: string;
  getTextToCopy?: () => Promise<string>;
  successMsg?: string;
  failedMsg?: string;
  alertLastSecs?: number;
}

export const CopyText = ({
  name,
  textToCopy,
  getTextToCopy,
  successMsg,
  failedMsg,
  alertLastSecs = 5,
}: CopyTextProps) => {
  const copy = async (text: string) => {
    const inputElement = document.createElement('input');
    inputElement.value = text;
    document.body.appendChild(inputElement);
    inputElement.focus();
    inputElement.select();
    try {
      await navigator.clipboard.writeText(text);
    } catch (error: any) {
      await document.execCommand('copy');
    }

    inputElement.remove();
  };

  return (
    <>
      <span
        style={{
          padding: '0px 5px',
          cursor: 'pointer',
          textTransform: 'capitalize',
        }}
        onClick={async () => {
          if (!textToCopy && !getTextToCopy) {
            return alert(
              'textToCopy and getTextToCopy can not be null at the same time',
            );
          }
          const text =
            textToCopy || (await getTextToCopy?.call(getTextToCopy)) || '';

          try {
            await copy(text);
          } catch (error: any) {
            console.error('copy failed: ', error.message);
            message.error(
              failedMsg || 'Failed to copied to clipboard!',
              alertLastSecs,
            );
            return;
          }

          message.success(
            successMsg || 'Text copied to clipboard!',
            alertLastSecs,
          );
        }}
      >
        {name}
      </span>
    </>
  );
};
