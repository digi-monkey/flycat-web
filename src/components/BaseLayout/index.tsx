import { useUserInfo } from './hooks';
import { RelaySelector } from 'components/RelaySelector';
import React, { useCallback, useState } from 'react';
import Navbar from './navbar';
import { UserDrawer } from './drawer';
import { Tabbar } from './tabbar';
import { cn } from 'utils/classnames';

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
  const { myProfile } = useUserInfo();
  const leftNodes: React.ReactNode[] = [];
  const rightNodes: React.ReactNode[] = [];

  React.Children.forEach(children, (child: React.ReactNode) => {
    if (!React.isValidElement(child)) return;
    if (child.type === Left) leftNodes.push(child);
    if (child.type === Right) rightNodes.push(child);
  });

  return (
    <div className="flex justify-center min-h-screen">
      <div className="container body grid grid-cols-8 lg:grid-cols-12">
        <aside className="hidden sm:block sm:col-span-1 xl:col-span-3">
          <div className="sticky top-0 pr-5 h-screen border-0 border-r border-solid border-neutral-200">
            <Navbar user={myProfile} />
          </div>
        </aside>
        <main
          className={cn(
            'col-span-12 sm:col-span-7 lg:col-span-8 xl:col-span-6',
            {
              'lg:col-span-11 xl:col-span-9': rightNodes.length === 0,
            },
          )}
        >
          <div className="min-h-screen border-0 border-r border-solid border-neutral-200">
            <header className="px-4 sticky top-0 sm:relative bg-white sm:bg-transparent bg-opacity-80 backdrop-blur z-50">
              <div className="flex h-16 items-center gap-3">
                <RelaySelector />
                <UserDrawer user={myProfile} />
              </div>
            </header>
            {leftNodes}
            <footer className="sm:hidden">
              <Tabbar />
            </footer>
          </div>
        </main>
        {rightNodes.length > 0 && (
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-0 px-5 h-screen">{rightNodes}</div>
          </div>
        )}
      </div>
    </div>
  );
};
