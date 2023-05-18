import { useMatchMobile } from 'hooks/useMediaQuery';
import { NavHeader, MenuListDefault } from '../NavHeader';

import React from 'react';
import styles from './index.module.scss';
import Mobile from './mobile';
import Container from 'components/Container';
import classNames from 'classnames';
import { useUserInfo } from './hooks';
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
  const isMobile = useMatchMobile();
  const leftNodes: React.ReactNode[] = [];
  const rightNodes: React.ReactNode[] = [];
  React.Children.forEach(children, (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Left) leftNodes.push(child);
    if (child.type === Right) rightNodes.push(child);
  });
  const { userMap } = useUserInfo();

  console.log(123, userMap);

  return <Container>
    {
      isMobile ? <Mobile body={leftNodes} userMap={userMap} /> : <>
        <MenuListDefault />
        <main className={classNames(styles.pcPadMain, {
          [styles.rightExists]: rightNodes.length
        })}>
          <div className={styles.left}>
            <NavHeader title={metaPage?.title} link={metaPage?.link} />
            {leftNodes}
          </div>
          { rightNodes.length > 0 && <div className={styles.right}>{rightNodes}</div> }
        </main>
      </>
    }
  </Container>;
};
