/**
 * Web Crypto PBKDF2 PIN hashing and verification
 */

export interface PinHashResult {
  salt: string;
  hash: string;
  iterations: number;
}

const ITERATIONS = 100000;

export async function hashPin(pin: string, providedSalt?: string): Promise<PinHashResult> {
  const enc = new TextEncoder();
  const pinData = enc.encode(pin);

  let saltBuffer: Uint8Array;
  if (providedSalt) {
    const saltBytes = [];
    for (let i = 0; i < providedSalt.length; i += 2) {
      saltBytes.push(parseInt(providedSalt.substr(i, 2), 16));
    }
    saltBuffer = new Uint8Array(saltBytes);
  } else {
    saltBuffer = new Uint8Array(16);
    crypto.getRandomValues(saltBuffer);
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  const hashHex = Array.from(new Uint8Array(exported))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const saltHex = Array.from(saltBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    salt: saltHex,
    hash: hashHex,
    iterations: ITERATIONS
  };
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  try {
    const result = await hashPin(pin, salt);
    return result.hash === expectedHash;
  } catch {
    return false;
  }
}
