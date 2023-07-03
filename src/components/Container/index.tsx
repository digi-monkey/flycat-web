import classNames from "classnames";
import styles from './index.module.scss';

interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return <div className={classNames('f-container', 'f-grid', styles.container)}>
    {children}
  </div>
}
export default Container;
