import { i18n } from 'next-i18next';
import { Event } from 'service/api';
import { Nip19 } from './19';
import { Paths } from 'constants/path';
import { UserMap } from 'service/type';

export class Nip21 {
  static replaceNpub(content: string) {
    // TODO
    // nostr:npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9
  }
  static replaceNprofile(
    event: Event,
    userMap: UserMap,  
  ) {
    let content = event.content;
    const match = /nostr:nprofile\S*\b/g.exec(content);

    if (userMap.size && match?.length) {
      const key = match[0];
      const nprofile = key.split(":")[1];
      const pubkey = Nip19.nprofileDecode(nprofile);
      const user = userMap.get(pubkey);
      if (user) {
        content = content.replace(key, `<a href="${i18n?.language + Paths.user + pubkey}" target="_self">@${user.name}</a>`);
      }
    }

    return content;
  }
  static replaceNote(content: string) {
    // TODO
    // nostr:note1fntxtkcy9pjwucqwa9mddn7v03wwwsu9j330jj350nvhpky2tuaspk6nqc
  }
  static replaceNevent(content: string) {
    // TODO
    // nostr:nevent1qqstna2yrezu5wghjvswqqculvvwxsrcvu7uc0f78gan4xqhvz49d9spr3mhxue69uhkummnw3ez6un9d3shjtn4de6x2argwghx6egpr4mhxue69uhkummnw3ez6ur4vgh8wetvd3hhyer9wghxuet5nxnepm
  }
}
