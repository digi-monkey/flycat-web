import { Paths } from 'constants/path';
import { useMyPublicKey } from 'hooks/useMyPublicKey';
import { useRouter } from 'next/router';
import { createElement, PropsWithChildren, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { getNavLink, MenuId, MenuItem } from './utils';

type NavLinkProps = PropsWithChildren<{
  item: MenuItem;
  className?: string;
  as?: string | React.ComponentType<any>;
  onClick?: (item: MenuItem) => void;
}>;

export function NavLink(props: NavLinkProps) {
  const { item, children } = props;
  const myPublicKey = useMyPublicKey();
  const router = useRouter();
  const dispatch = useDispatch();

  const link = useMemo(
    () => getNavLink(item, myPublicKey),
    [item, myPublicKey],
  );

  const onClick = useCallback(() => {
    props.onClick?.(item);
    if (item.id === MenuId.signOut) {
      dispatch({
        type: 'LOGOUT',
      });
      router.push(Paths.login);
      return;
    }
    router.push(link);
  }, [dispatch, item, link, router, props]);

  const component = props.as ?? 'div';

  return createElement(
    component,
    {
      className: props.className,
      onClick,
    },
    children,
  );
}
