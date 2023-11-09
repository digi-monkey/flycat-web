import { Paths } from 'constants/path';
import Icon from 'components/Icon';
import { message } from 'antd';

export enum MenuId {
  home = 'home',
  communities = 'communities',
  relays = 'relays',
  bookmarks = 'bookmarks',
  notifications = 'notifications',
  profile = 'profile',
  drafts = 'drafts',
  settings = 'settings',
  preference = 'preference',
  backup = 'backup',
  signOut = 'signOut',
  add = 'add',
  search = 'search',
  about = 'about',
}

export const NavMenus = [
  {
    id: MenuId.home,
    icon: <Icon type="icon-home" />,
    title: 'nav.menu.home',
    link: Paths.home,
  },
  {
    id: MenuId.communities,
    icon: <Icon type="icon-explore" />,
    title: 'nav.menu.communities',
    link: Paths.communities,
  },
  {
    id: MenuId.relays,
    icon: <Icon type="icon-Relay" />,
    title: 'nav.menu.relays',
    link: Paths.relay,
  },
  {
    id: MenuId.bookmarks,
    icon: <Icon type="icon-bookmark" />,
    title: 'nav.menu.bookmarks',
    link: Paths.bookmarks,
  },
  {
    id: MenuId.search,
    icon: <Icon type="icon-search" />,
    title: 'nav.menu.search',
    link: Paths.search,
  },
  {
    id: MenuId.notifications,
    icon: <Icon type="icon-notification" />,
    title: 'nav.menu.notifications',
    link: Paths.notification,
  },
  {
    id: MenuId.preference,
    icon: <Icon type="icon-Gear" />,
    title: 'nav.menu.preference',
    link: Paths.preference,
  },
  {
    id: MenuId.profile,
    icon: <Icon type="icon-user" />,
    title: 'nav.menu.profile',
    link: Paths.user,
  },
  {
    id: MenuId.about,
    icon: <Icon type="icon-emoji" />,
    title: 'nav.menu.about',
    link: Paths.about,
  },
];

export const UserMenus = [
  {
    id: MenuId.profile,
    icon: <Icon type="icon-user" />,
    title: 'nav.menu.profile',
    link: Paths.user,
  },
  NavMenus[3],
  {
    id: MenuId.search,
    icon: <Icon type="icon-search" />,
    title: 'nav.menu.search',
    link: Paths.search,
  },
  ,
  {
    id: MenuId.drafts,
    icon: <Icon type="icon-Draft" />,
    title: 'nav.menu.drafts',
    link: Paths.draft,
  },
  {
    id: MenuId.settings,
    icon: <Icon type="icon-Gear" />,
    title: 'nav.menu.setting',
    link: Paths.setting,
  },
  {
    id: MenuId.about,
    icon: <Icon type="icon-emoji" />,
    title: 'nav.menu.about',
    link: Paths.about,
  },
  {
    id: MenuId.signOut,
    icon: <Icon type="icon-Move-out" />,
    title: 'nav.menu.signOut',
    link: Paths.login,
  },
];

/**
 * Get nav link
 * @param item
 * @param  myPublicKey
 * @returns {string}
 */
export const getNavLink = (item, myPublicKey) => {
  let link = item.link;
  if (item.id === MenuId.profile) link = item.link + myPublicKey;
  return link;
};

/**
 * Navigation action
 * @param item
 * @param myPublicKey
 * @param router
 * @param isLoggedIn
 * @param t
 * @returns {undefined}
 */
export const navClick = (item, myPublicKey, router, isLoggedIn, t) => {
  const link: string | undefined = getNavLink(item, myPublicKey);

  if (
    !isLoggedIn &&
    [MenuId.notifications, MenuId.bookmarks].includes(item.id)
  ) {
    message.warning(t('comment.login'));
    return;
  }

  router.push(link);
};
