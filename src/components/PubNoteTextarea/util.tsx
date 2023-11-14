import { SignEvent } from 'store/loginReducer';
import { CallWorker } from 'core/worker/caller';
import { ImageProvider, compressImage } from 'core/api/img';
import { EventTags, Naddr, Tags, WellKnownEventKind } from 'core/nostr/type';
import { RawEvent } from 'core/nostr/RawEvent';
import { noticePubEventResult } from 'components/PubEventNotice';
import { DecodedNprofileResult, Nip19 } from 'core/nip/19';

export const makeInvoice = async (setText) => {
  if (typeof window?.webln === 'undefined') {
    return alert('No WebLN available.');
  }

  try {
    await window.webln.enable();
    const result = await window.webln.makeInvoice({});
    setText(prev => {
      if (result == null) return prev;
      const text = prev;
      return text + '\n\n' + result.paymentRequest;
    });
  } catch (error) {
    console.log(error);
    return alert('An error occurred during the makeInvoice() call.');
  }
}

export const handleImgUpload = async (
  blob: Blob,
  fileName: string,
  imgType: string,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  setAttachImgs: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const file = new File([blob], fileName, { type: imgType });
  const imageFile = await compressImage(file);
  const formData = new FormData();
  formData.append('fileToUpload', imageFile, imageFile.name);
  formData.append('submit', 'Upload Image');
  const api = new ImageProvider();
  const url = await api.uploadImage(formData);
  if (!url.startsWith('http')) {
    setIsUploading(false);
    return alert(url);
  }

  // record url
  setAttachImgs(prev => {
    const newList = prev;
    if (!newList.includes(url)) {
      newList.push(url);
    }
    return newList;
  });

  setIsUploading(false);
};

export const handleFileSelect = (
  event: React.ChangeEvent<HTMLInputElement>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  setAttachImgs: React.Dispatch<React.SetStateAction<string[]>>
) => {
  setIsUploading(true);
  const file = event.target.files?.[0];

  if (!file) {
    setIsUploading(false);
    return;
  }

  const fileReader = new FileReader();

  fileReader.onloadend = () => {
    if (fileReader.result) {
      const blob = new Blob([fileReader.result], { type: file.type });
      handleImgUpload(blob, file.name, file.type, setIsUploading, setAttachImgs);
    }
  };

  fileReader.readAsArrayBuffer(file);
};

function replaceKeysWithPrefix(obj, str) {
  const regex = new RegExp(`@(${Object.keys(obj).join('|')})(?=\\b|\\s)`, 'g');
  const parts = str.split(/(\s+)/);
  const replacedParts = parts.map(part => regex.test(part) ? part.replace(regex, obj[RegExp.$1]) : part);

  return replacedParts.join('');
}

export const handleSubmitText = async (
  formEvt: React.FormEvent,
  text: string,
  attachImgs: string[],
  setText: React.Dispatch<React.SetStateAction<string>>,
  setAttachImgs: React.Dispatch<React.SetStateAction<string[]>>,
  selectMention: object,
  signEvent: SignEvent | undefined,
  myPublicKey: string,
  worker: CallWorker | undefined,
  pubSuccessCallback?: (eventId, relayUrl) => any,
  selectedCommunity?: Naddr
) => {
  formEvt.preventDefault();

  const pTagPubKeys = Object.values(selectMention).map(nprofile => (Nip19.decodeShareable(nprofile.slice(6)).data as DecodedNprofileResult).pubkey);
  const hashTags = extractHashTags(text);

  const newText = replaceKeysWithPrefix(selectMention, text);
  let textWithAttachImgs = newText;
  for (const url of attachImgs) {
    textWithAttachImgs += `\n${url}`;
  }

  // publish
  if (!worker) return alert('worker is null');
  if (signEvent == null) return alert('no sign method!');

  let tags: Tags = pTagPubKeys.map(pk => [EventTags.P, pk]);
  if (selectedCommunity) {
    tags.push([EventTags.A, selectedCommunity, '']);
  }
  if (hashTags.length > 0) {
    tags = tags.concat(hashTags.map(t => [EventTags.T, t.substring(1)]));// remove #
  }

  const rawEvent = new RawEvent(
    myPublicKey,
    WellKnownEventKind.text_note,
    tags,
    textWithAttachImgs,
  );
  const event = await signEvent(rawEvent);
  const handler = worker.pubEvent(event);
  noticePubEventResult(worker.relays.length, handler, pubSuccessCallback);

  setText('');
  setAttachImgs([]);
};

export function extractHashTags(text: string): string[] {
  const hashtagRegex = /(#\S+)/g;
  const matches = text.match(hashtagRegex);
  return matches || [];
}
