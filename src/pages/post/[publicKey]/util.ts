import { EventTags, isEventETag, RawEvent, WellKnownEventKind, Event } from "service/api";
import Alert from 'sweetalert2/dist/sweetalert2.js';

export async function submitReply(worker, signEvent, content, pubkey, tags, onClose) {
  if (signEvent == null) {
    noSignMethodTipsy();
    return;
  }

  const rawEvent = new RawEvent(
    pubkey,
    WellKnownEventKind.text_note,
    tags,
    content,
    Math.round(Date.now() / 1000),
  );
  
  const event = await signEvent(rawEvent);
  worker?.pubEvent(event);

  onClose();
  Alert.fire({
    icon: 'success',
    timer: 2000,
    text: 'Reply successed!',
  });
}

export async function likeComment(worker, signEvent, content, pubkey, tags) {
  if (signEvent == null) {
    noSignMethodTipsy();
    return false;
  }

  const rawEvent = new RawEvent(
    pubkey,
    WellKnownEventKind.like,
    tags,
    content,
    Math.round(Date.now() / 1000),
  );
  
  const event = await signEvent(rawEvent);
  worker?.pubEvent(event);
  return true;
}

export async function dontLikeComment(worker, signEvent, eventId, pubkey) {
  if (signEvent == null) {
    noSignMethodTipsy();
    return false;
  }

  const rawEvent = new RawEvent(
    pubkey,
    WellKnownEventKind.event_del,
    [[EventTags.E, eventId]],
    "",
    Math.round(Date.now() / 1000),
  );
  
  const event = await signEvent(rawEvent);
  worker?.pubEvent(event);
  return true;
}

export const parseLikeData = (comment, worker, signEvent, myPublicKey) => {
  likeComment(worker, signEvent, "+", myPublicKey, [
    [EventTags.P, comment.pubkey],
    [EventTags.E, comment.id, '', 'reply'],
    [EventTags.E, comment.id, '', 'root'],
  ]);
}

export const nonzero = target => Object.keys(target || {}).length > 0;

export function findNodeById(root, id) {
  if (root.replys) {
    for (const key of Object.keys(root.replys)) {
      const result = findNodeById(root.replys[key], id);
      if (result) return result;
    }
  }
  
  if (root.id === id) return root;
  return null;
}

export function replyComments(comment, callback?) {
  return function replysHandleEvent(event: Event, relayUrl?: string) {
    const tagsId = event.tags.filter(item => isEventETag(item)).flat()[1];
    
    if (event.kind === WellKnownEventKind.text_note && tagsId === comment.id) {
      if (comment.replys) comment.replys[event.id] = event;
      else comment.replys = {[event.id]: event};

      typeof callback === 'function' && callback();
    }
  }
}

function noSignMethodTipsy() {
  Alert.fire({
    icon: 'error',
    timer: 2000,
    text: 'no sign method!',
  });
}
