export function getMemoryPointer(wasmMemory, data) {
  const ptr = wasmMemory.grow(data.length);
  new Uint8Array(wasmMemory.buffer, ptr, data.length).set(data);
  return ptr;
}

export function readStringFromMemory(wasmMemory, ptr) {
  const data = new Uint8Array(wasmMemory.buffer);
  const stringArray: any[] = [];

  // Read characters from memory until null terminator is encountered
  for (let i = ptr; data[i] !== 0; ++i) {
    stringArray.push(data[i]);
  }

  // Create a string from the character codes and return
  return new TextDecoder().decode(new Uint8Array(stringArray));
}
