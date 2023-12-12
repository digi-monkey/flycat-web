import { Image } from 'antd';

export function ImagePreview({ url }: { url: string }) {
  return (
    <li onClick={(e)=>e.stopPropagation()}>
      <Image width={'100%'} height={200} src={url} />
    </li>
  );
}
