import { Event, EventTags, Nip19DataType, nip19Encode } from 'service/api';
import { shortPublicKey } from 'service/helper';
import { UserMap } from 'service/type';

export class Nip08 {
  static replaceMentionPublickey(event: Event, userMap: UserMap) {
    const replacementData = event.tags
      .map((t, index) => {
        if (t[0] === EventTags.P) {
          if (t[1] == null) throw new Error('invalid P tags!');

          return { index, pk: t[1] };
        }
        return null;
      })
      .filter(t => t !== null) as { index: number; pk: string }[];

    let content = event.content;
    for (const replacement of replacementData) {
      const regex = new RegExp(`#\\[${replacement.index}\\]`, 'g');
      content = content.replace(
        regex,
        `<a href="/user/${replacement.pk}">@${
          userMap.get(replacement.pk)?.name || shortPublicKey(replacement.pk)
        }</a>`,
      );
    }

    return content;
  }

  static replaceMentionEventId(event: Event) {
    const replacementData = event.tags
      .map((t, index) => {
        if (t[0] === EventTags.E) {
          if (t[1] == null) throw new Error('invalid E tags!');

          return { index, eventId: t[1] };
        }
        return null;
      })
      .filter(t => t !== null) as { index: number; eventId: string }[];

    let content = event.content;
    for (const replacement of replacementData) {
      const regex = new RegExp(`#\\[${replacement.index}\\]`, 'g');
      content = content.replace(
        regex,
        `<a href="/event/${replacement.eventId}">@${nip19Encode(
          replacement.eventId,
          Nip19DataType.EventId,
        )}</a>`,
      );
    }

    return content;
  }
}
