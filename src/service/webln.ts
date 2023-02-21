export class WebLn {
  constructor() {
    if (typeof window.webln === undefined) {
      throw new Error('please init in lighting wallet web env');
    }
  }
}
