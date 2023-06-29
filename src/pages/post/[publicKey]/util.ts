export const toTimeString = (ts?: number) =>
  new Date(ts ? ts * 1000 : 0).toLocaleDateString();
