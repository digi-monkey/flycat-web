import classnames from 'classnames';
import Script from 'next/script';

type Props = {
  className?: string;
  type: string;
} & React.SVGProps<SVGSVGElement>;

// iconfont url
// https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=4061955
export default function Icon(props: Props) {
  const { className, type, ...rest } = props;

  return (
    <>
      <Script src={`${process.env.NEXT_PUBLIC_ICONS_PATH}`}></Script>
      <svg
        className={classnames('icon', className)}
        aria-hidden="true"
        {...rest}
      >
        <use xlinkHref={`#${type}`}></use>
      </svg>
    </>
  );
}
