import { Image } from 'antd';

export function ImagePreview({ url }: { url: string }) {
  return (
    <li>
      <Image width={'100%'} height={200} src={url} />
    </li>
  );
}
