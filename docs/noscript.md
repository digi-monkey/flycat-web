# Noscript

Noscript, a nostr script, is just a piece of wasm bytecode stored on relay, composed by users instead of flycat or any other platforms/clients. You can put arbitrary logic on the nostr script.

the script can be used in many use cases. below is such one, costuming a timeline via nostr scripts.

## Custom timeline script

Event format:

```json
{
  "id": <32-bytes lowercase hex-encoded sha256 of the serialized event data>,
  "pubkey": <32-bytes lowercase hex-encoded public key of the event creator>,
  "created_at": <unix timestamp in seconds>,
  "kind": 32024,
  "tags": [
    ['d', 'your script identifier'],
    ['noscript', 'a unique tag to allow client to understand what kind of script it is'],
    ['description', 'your script description'],

    // filter tag
    ['authors', 'pubkey1', 'pubkey2', 'pubkey3'...],
    ['kinds', 'kind1', 'kind2', 'kind3'...],
    ['since', 'unix timestamp in seconds'],
    ['until', 'unix timestamp in seconds']
    ...
  ],
  "content": <wasm bytecode, the bytecode must include a is_valid_event function signature>,
  "sig": <64-bytes lowercase hex of the signature of the sha256 hash of the serialized event data, which is the same as the "id" field>
}
```

wasm bytecode function signature

```rust
pub fn is_valid_event(event: JsValue) -> bool
```

example: https://github.com/digi-monkey/flycat-web/blob/master/wasm/src/lib.rs
