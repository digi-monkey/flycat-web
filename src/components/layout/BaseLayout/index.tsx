import { NavHeader } from '../NavHeader';
import { useUserInfo } from './hooks';
import { RelaySelector } from 'components/RelaySelector';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useReadonlyMyPublicKey } from 'hooks/useMyPublicKey';

import React from 'react';
import styles from './index.module.scss';
import Mobile from './mobile';
import PcPadNav from './pc';
import Container from 'components/Container';
import classNames from 'classnames';
export interface BaseLayoutProps {
  children: React.ReactNode;
  silent?: boolean;
  metaPage?: {
    title?: string;
    link?: string;
  };
}

export interface LeftProps {
  children: React.ReactNode;
}

export const Left: React.FC<LeftProps> = ({ children }) => (
  <div>{children}</div>
);

export interface RightProps {
  children?: React.ReactNode;
}
export const Right: React.FC<RightProps> = ({ children }) => (
  <div>{children}</div>
);

export const BaseLayout: React.FC<BaseLayoutProps> = ({
  children,
  silent,
  metaPage,
}) => {
  const { userMap } = useUserInfo();
  const myPublicKey = useReadonlyMyPublicKey();
  const user = userMap.get(myPublicKey);
  const isMobile = useMatchMobile();
  const leftNodes: React.ReactNode[] = [];
  const rightNodes: React.ReactNode[] = [];
  
  React.Children.forEach(children, (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Left) leftNodes.push(child);
    if (child.type === Right) rightNodes.push(child);
  });

  return <Container>
    {
      isMobile ? <Mobile body={leftNodes} user={user} /> : <>
        <PcPadNav user={user} />
        <main className={classNames(styles.pcPadMain, {
          [styles.rightExists]: rightNodes.length
        })}>
          <div className={styles.left}>
            <RelaySelector />
            {leftNodes}
          </div>
          { rightNodes.length > 0 && <div className={styles.right}>{rightNodes}</div> }
        </main>
      </>
    }
  </Container>;
};
