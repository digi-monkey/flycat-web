import { Modal } from 'antd';
import { useUserInfo } from './hooks';
import { RelaySelector } from 'components/RelaySelector';
import { useMatchMobile } from 'hooks/useMediaQuery';
import { useTranslation } from 'next-i18next';

import React, { useState } from 'react';
import Icon from 'components/Icon';
import Mobile from './mobile';
import styles from './index.module.scss';
import PcPadNav from './pc';
import Container from 'components/Container';
import classNames from 'classnames';
import PubNoteTextarea from '../PubNoteTextarea';

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

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { myProfile } = useUserInfo();
  const isMobile = useMatchMobile();
  const leftNodes: React.ReactNode[] = [];
  const rightNodes: React.ReactNode[] = [];

  const [openWrite, setOpenWrite] = useState(false);

  React.Children.forEach(children, (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Left) leftNodes.push(child);
    if (child.type === Right) rightNodes.push(child);
  });

  return (
    <Container>
      <PcPadNav user={myProfile} setOpenWrite={setOpenWrite} />
    </Container>
  );
};
