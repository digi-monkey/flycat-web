import { Paths } from 'constants/path';
import Icon from 'components/Icon';
import { message } from 'antd';

export enum MenuId {
  home = 'home',
  explore = 'explore',
  relays = 'relays',
  bookmarks = 'bookmarks',
  notifications = 'notifications',
  profile = 'profile',
  drafts = 'drafts',
  settings = 'settings',
  backup = 'backup',
  signOut = 'signOut',
  add = 'add'
}

export const NavMenus = [{
  id: MenuId.home,
  icon: <Icon type="icon-home" />,
  title: 'nav.menu.home',
  link: Paths.home
}, {
  id: MenuId.explore,
  icon: <Icon type="icon-explore" />,
  title: 'nav.menu.explore',
  link: Paths.explore
}, {
  id: MenuId.relays,
  icon: <Icon type="icon-Relay" />,
  title: 'nav.menu.relays',
  link: Paths.relay
}, {
  id: MenuId.bookmarks,
  icon: <Icon type="icon-bookmark" />,
  title: 'nav.menu.bookmarks',
  link: Paths.bookmarks
}, {
  id: MenuId.notifications,
  icon: <Icon type="icon-notification" />,
  title: 'nav.menu.notifications',
  link: Paths.notification
}];

export const UserMenus = [{
  id: MenuId.profile,
  icon: <Icon type="icon-user" />,
  title: 'nav.menu.profile',
  link: Paths.user
}, 
NavMenus[3],
,{
  id: MenuId.drafts,
  icon: <Icon type="icon-Draft" />,
  title: 'nav.menu.drafts',
  link: Paths.draft
}, {
  id: MenuId.settings,
  icon: <Icon type="icon-Gear" />,
  title: 'nav.menu.setting',
  link: Paths.setting
}, {
  id: MenuId.signOut,
  icon: <Icon type="icon-Move-out" />,
  title: 'nav.menu.signOut',
  link: Paths.login
}];

export const navClick = (item, myPublicKey, router, isLoggedIn, t) => {
  let pathname = item.link;
  const query = {};

  if (!isLoggedIn && [MenuId.notifications, MenuId.bookmarks].includes(item.id)) {
    message.warning(t('comment.login'));
    return;
  }
  
  if (item.id === MenuId.profile) pathname = item.link + myPublicKey;

  router.push({ pathname, query });
}
