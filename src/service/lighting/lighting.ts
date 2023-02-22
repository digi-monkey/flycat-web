export async function payLnUrlInWebLn(url: string) {
  if (!window.webln) {
    return alert('window.webln is null!');
  }
  await window.webln.enable();
  await window.webln.lnurl(url);
}
