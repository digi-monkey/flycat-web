export function getTweetId(url) {
  const parse = new URL(url);

  if (parse.host == 'twitter.com') {
    const paths = parse.pathname.split('/');
    if (paths[2] == 'status') return paths[3];
  }

  return false;
}
