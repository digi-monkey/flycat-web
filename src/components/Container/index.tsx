import classNames from "classnames";
import styles from './index.module.scss';

interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return <main className={classNames('f-container', styles.container)}>
    {children}
  </main>
}
export default Container;
