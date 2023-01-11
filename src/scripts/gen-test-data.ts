import {
  encryptTextToPk,
  generateRandomAesKey,
  generateRandomIv,
  generateRandomRsaKeys,
} from '../service/crypto';

const genRsaPairs = (total = 5) => {
  return new Array(total).fill(1).map(i => generateRandomRsaKeys());
};

const genData = (rsaArray: any[], key: string, iv: string) => {
  const arrObj = rsaArray.map(rsa => {
    const AESKey = encryptTextToPk(rsa.publicKey, key);
    const AESIV = encryptTextToPk(rsa.publicKey, iv);
    const value = {
      AESKey,
      AESIV,
    };
    let obj = {};
    obj[rsa.publicKey] = value;
    return obj;
  });
  return Object.assign({}, ...arrObj);
};

export function genTestData() {
  const rsaArray = genRsaPairs();
  const key = generateRandomAesKey();
  const iv = generateRandomIv();
  console.log('rsaArray =>', rsaArray);
  console.log('gen test data =>', genData(rsaArray, key, iv));
}
