import Pages from 'constants/router';

type PathsType = Record<keyof typeof Pages, string>;

export const Paths: PathsType = Object.keys(Pages).reduce((cache, key) => {
  cache[key] = Pages[key].path.replace(/\/\[(.+?)\]/g, '');
  return cache;
}, {} as PathsType);
