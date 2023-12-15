import { base, HttpRequest, DEFAULT_API_URL, HttpProtocolMethod } from './http';
import imageCompression from 'browser-image-compression';

export class ImageProvider extends base {
  constructor(url?: string, httpRequest?: HttpRequest) {
    super(url || DEFAULT_API_URL, httpRequest);
  }

  async getVersion(): Promise<string | null> {
    return await this.httpRequest('version', {}, HttpProtocolMethod.get);
  }

  async uploadImage(formData: FormData) {
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    const url: string = await this.httpRequest(
      'upload/flycat.php',
      formData,
      HttpProtocolMethod.post,
      {
        headers,
      },
    );
    return url;
  }
}

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.9, // some png might not meets desire of 1mb
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);

  console.debug('compressedFile instanceof Blob', file, compressedFile); // true

  return compressedFile;
}
