export interface Nip04 {
  encrypt(pubkey, plaintext): Promise<string>; // returns ciphertext+iv as specified in nip04
  decrypt(pubkey, ciphertext): Promise<string>; // takes ciphertext+iv as specified in nip04
}
