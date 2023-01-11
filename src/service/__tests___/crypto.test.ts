import { bech32Encode, bech32Decode } from 'service/crypto';

describe('bech32 encode', () => {
  it('should return a correct sha256 event id', () => {
    const encoded = bech32Encode(
      '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
      'npub',
    );

    expect(encoded).toEqual(
      'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
    );
  });

  it('should decode bech32', () => {
    const { decoded, prefix } = bech32Decode(
      'npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6',
    );

    expect(decoded).toEqual(
      '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
    );
    expect(prefix).toEqual('npub');
  });
});
