export async function payLnUrlInWebLn(url: string) {
  if (!window.webln) {
    return alert('window.webln is null!');
  }
  await window.webln.enable();
  await window.webln.lnurl(url);
}

export async function sendPaymentInWebLn(url: string) {
  if (!window.webln) {
    return alert('window.webln is null!');
  }
  await window.webln.enable();
  await window.webln.sendPayment(url);
}
