import axios from 'axios';

export const DEFAULT_API_URL = 'https://nostr.build/api';

//axios.defaults.withCredentials = true;
export type ApiHttpResponse = {
  status: 'ok' | 'failed';
  data?: any;
  error?: string;
};
export enum HttpProtocolMethod {
  'get',
  'post',
  'option',
}
export type HttpRequest = (
  subPath: string,
  params?: Params,
  type?: HttpProtocolMethod,
  cfg?: Cfg,
) => Promise<any>;

export interface Params {
  [key: string]: any;
}

export interface Cfg {
  [key: string]: any;
}

export class base {
  url: string;
  httpRequest: HttpRequest;

  constructor(baseUrl: string, httpRequest?: HttpRequest) {
    this.url = baseUrl.endsWith('/')
      ? baseUrl.slice(0, baseUrl.length - 1)
      : baseUrl;
    this.httpRequest = httpRequest || this.newHttpRequest();
  }

  newHttpRequest() {
    return async (
      subPath: string,
      params: Params = {},
      type: HttpProtocolMethod = HttpProtocolMethod.get,
      cfg: Cfg = {},
    ) => {
      const baseUrl = this.url;
      let axiosRes;
      const url = encodeURI(`${baseUrl}/${subPath}`);
      switch (type) {
        case HttpProtocolMethod.get:
          axiosRes = await axios.get(url, {
            params,
            ...cfg,
          });
          break;

        case HttpProtocolMethod.post:
          axiosRes = await axios.post(url, params, cfg);
          break;

        default:
          throw new Error(`unsupported HttpRequestType, ${type}`);
      }
      if (axiosRes.status !== 200) {
        throw new Error(`http request fails, ${axiosRes}`);
      }

      const response = axiosRes.data;
      return response;
    };
  }

  async ping() {
    return await this.httpRequest('ping');
  }

  setUrl(newUrl: string) {
    if (newUrl.startsWith('http')) {
      this.url = newUrl;
    } else {
      this.url = `http://${newUrl}`;
    }
  }

  getUrl() {
    return this.url;
  }
}
