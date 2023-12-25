import { EventId } from 'core/nostr/type';

export interface NotePreview {
  title: string;
  content: string;
  image?: string;
  authorProfile?: {
    name: string;
    picture: string;
  };
  created_at: number;
}

export async function getNotePreview(eventId: EventId) {
  const timeout = 2000;
  const url = 'https://nostr-preview.fly.dev' + `/e/${eventId}`;
  try {
    const res = await fetchWithTimeout(url, timeout, { cache: 'force-cache' });
    const jsonRes = await res.json();
    if (jsonRes.status === 'ok') {
      return jsonRes.data as NotePreview;
    }
  } catch (err: any) {
    console.log(err.message);
  }

  return null;
}

async function fetchWithTimeout(url: string, timeout: number, options: any) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(timeoutId);
  return response;
}
