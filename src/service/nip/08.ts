import { i18n } from 'next-i18next';
import { UserMap } from 'service/type';
import { shortPublicKey } from 'service/helper';
import { isValidPublicKey } from 'service/validator';
import { Event, EventTags } from 'service/api';
import { Nip19DataType, Nip19 } from 'service/nip/19';

export enum RenderFlag {
  Markdown,
  Html,
}
export class Nip08 {
  static replaceMentionPublickey(
    event: Event,
    userMap: UserMap,
    renderFlag: RenderFlag = RenderFlag.Html,
  ) {
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
      if (renderFlag === RenderFlag.Html) {
        content = content.replace(
          regex,
          `<a href="/${i18n?.language}/user/${replacement.pk}">@${
            userMap.get(replacement.pk)?.name || shortPublicKey(replacement.pk)
          }</a>`,
        );
      } else if (renderFlag === RenderFlag.Markdown) {
        content = content.replace(
          regex,
          `[@${
            userMap.get(replacement.pk)?.name || shortPublicKey(replacement.pk)
          }](/${i18n?.language}/user/${replacement.pk})`,
        );
      }
    }

    return content;
  }

  static replaceMentionEventId(
    event: Event,
    renderFlg: RenderFlag = RenderFlag.Html,
  ) {
    const replacementData = event.tags
      .map((t, index) => {
        if (t[0] === EventTags.E) {
          if (!isValidPublicKey(t[1])) return null; // todo: handle naddr type

          return { index, eventId: t[1] };
        }
        return null;
      })
      .filter(t => t !== null) as { index: number; eventId: string }[];

    let content = event.content;
    for (const replacement of replacementData) {
      const regex = new RegExp(`#\\[${replacement.index}\\]`, 'g');
      if (renderFlg === RenderFlag.Html) {
        content = content.replace(
          regex,
          `<a href="/${i18n?.language}/event/${replacement.eventId}">@${Nip19.encode(
            replacement.eventId,
            Nip19DataType.EventId,
          )}</a>`,
        );
      } else if (renderFlg === RenderFlag.Markdown) {
        content = content.replace(
          regex,
          `[@${Nip19.encode(
            replacement.eventId,
            Nip19DataType.EventId,
          )}](/${i18n?.language}/event/${replacement.eventId})`,
        );
      }
    }

    return content;
  }
}
