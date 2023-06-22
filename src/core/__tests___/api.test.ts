import { schnorrVerify, schnorrSign } from 'core/crypto';
import { RawEvent } from 'core/nostr/RawEvent';

describe('sha256 event id', () => {
  it('should return a correct sha256 event id', () => {
    const expectedEvent = {
      pubkey:
        '7cf68b47a2b243d06322bfdb6a1c2422fb8b3a18d18a5c90c27b59e8f612553e',
      content: '各地的城投债到了玩不下去的地步了？',
      id: '340e16e59dfd662d3114d77f2f0f6e9a19b3e6f6b8036f76ee18b698142fc553',
      created_at: 1673143563,
      sig: '19e450be79cb9fe80174becaadd97358c46729ea6501356fa23cfceed3cf63847bbbe2cefa4233226da868a09b184938836a3c49746d8dfde2fa4f5c9a2b4fde',
      kind: 1,
      tags: [],
    };
    const rawEvent = new RawEvent(
      expectedEvent.pubkey,
      expectedEvent.kind,
      expectedEvent.tags,
      expectedEvent.content,
      expectedEvent.created_at,
    );

    expect(rawEvent.sha256()).toEqual(expectedEvent.id);
  });

  // it('should pass secp2561 sig', async()=>{
  // 	const privateKeyHex = 'B7E151628AED2A6ABF7158809CF4F3C762E7160F38B4DA56A784D9045190CFEF';
  // 	const message = '243F6A8885A308D313198A2E03707344A4093822299F31D0082EFA98EC4E6C89';
  // 	const expectedSig = '6D461BEB2F2DA00027D884FD13A24E2AE85CAECCA8AAA2D41777217EC38FB4960A67D47BC4F0722754EDB0E9017072600FFE4030C2E73771DCD3773F46A62652';
  // 	const sig = await schnorrSign(message, privateKeyHex);
  // 	expect(sig).toEqual(expectedSig.toLowerCase());
  // });

  it('should return a correct signature', async () => {
    const expectedEvent = {
      pubkey:
        '45c41f21e1cf715fa6d9ca20b8e002a574db7bb49e96ee89834c66dac5446b7a',
      content:
        'Quick question, what is the default relay when I post something on damus? Is it something like the first relay on my relay list? I see there is also a broadcast button when I long pressed a post. So is there a reason not broadcasting the post to all relays by default?',
      id: 'e1636d84fab36baae0e380cfc2ec0b7a8ca300a83df8a8a1f73cd723d4c64f62',
      created_at: 1673108163,
      sig: '8b46a51e85ba2eab5d0e2ce85c4f8d8a45bd430a7b71cd585dae3e353b2996872a12539e771fdef6c63d38d63b269d8ee7f27538a47aa3beb1d8efd6fbb18a17',
      kind: 1,
      tags: [],
    };

    const rawEvent = new RawEvent(
      expectedEvent.pubkey,
      expectedEvent.kind,
      expectedEvent.tags as any,
      expectedEvent.content,
      expectedEvent.created_at,
    );

    expect(rawEvent.sha256()).toEqual(expectedEvent.id);

    const privateKey =
      '4edba36c5daffb50f1c6acc666a8eb2d4a122f02ff5b935ff6d20b265846e10c'.toUpperCase();

    const isVerify = await schnorrVerify(
      expectedEvent.id,
      expectedEvent.pubkey,
      expectedEvent.sig,
    );
    expect(isVerify).toEqual(true);

    const sig1 = await schnorrSign(expectedEvent.id, privateKey);
    const isVerify1 = await schnorrVerify(
      expectedEvent.id,
      expectedEvent.pubkey,
      sig1,
    );
    expect(isVerify1).toEqual(true);

    const sig2 = await rawEvent.sign(privateKey);
    const isVerify2 = await schnorrVerify(
      rawEvent.sha256(),
      expectedEvent.pubkey,
      sig2,
    );
    expect(isVerify2).toEqual(true);
  });
});
