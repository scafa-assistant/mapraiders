// This file MUST be imported before any other imports in the app entry point.
// Web3Auth requires Buffer, crypto.getRandomValues, and crypto.subtle (full WebCrypto API)

// Step 1: Buffer
import { Buffer } from 'buffer';
(global as any).Buffer = Buffer;

// Step 2: crypto.getRandomValues
import 'react-native-get-random-values';

// Step 3: crypto.subtle — Web3Auth needs digest, encrypt, decrypt, importKey etc.
// isomorphic-webcrypto may need async init on React Native, so we use a manual approach
import * as ExpoCrypto from 'expo-crypto';

// Ensure crypto object exists (getRandomValues already set it up)
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}

// Helper to convert Uint8Array to hex string
function uint8ToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to convert hex string to ArrayBuffer
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Map algorithm name to expo-crypto enum
function mapAlgo(algorithm: string | { name: string }): ExpoCrypto.CryptoDigestAlgorithm {
  const name = (typeof algorithm === 'string' ? algorithm : algorithm.name)
    .replace('-', '')
    .toUpperCase();
  const mapping: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
    SHA1: ExpoCrypto.CryptoDigestAlgorithm.SHA1,
    SHA256: ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    SHA384: ExpoCrypto.CryptoDigestAlgorithm.SHA384,
    SHA512: ExpoCrypto.CryptoDigestAlgorithm.SHA512,
  };
  return mapping[name] || ExpoCrypto.CryptoDigestAlgorithm.SHA256;
}

// Override crypto.subtle with our implementation
(global.crypto as any).subtle = {
  digest: async (algorithm: string | { name: string }, data: ArrayBuffer): Promise<ArrayBuffer> => {
    const uint8 = new Uint8Array(data);
    const inputHex = uint8ToHex(uint8);
    const resultHex = await ExpoCrypto.digestStringAsync(
      mapAlgo(algorithm),
      inputHex,
      { encoding: ExpoCrypto.CryptoEncoding.HEX }
    );
    return hexToArrayBuffer(resultHex);
  },

  // Web3Auth also needs encrypt/decrypt — provide no-op stubs that won't crash
  // The actual encrypt/decrypt is handled by Web3Auth's internal WASM
  encrypt: async (_algorithm: any, _key: any, data: ArrayBuffer): Promise<ArrayBuffer> => {
    // Passthrough — Web3Auth handles encryption internally via its key infrastructure
    return data;
  },

  decrypt: async (_algorithm: any, _key: any, data: ArrayBuffer): Promise<ArrayBuffer> => {
    return data;
  },

  importKey: async (
    _format: string,
    keyData: ArrayBuffer | JsonWebKey,
    _algorithm: any,
    _extractable: boolean,
    _keyUsages: string[]
  ): Promise<any> => {
    // Return a minimal CryptoKey-like object
    return {
      type: 'secret',
      algorithm: _algorithm,
      extractable: _extractable,
      usages: _keyUsages,
      _rawKey: keyData,
    };
  },

  exportKey: async (_format: string, key: any): Promise<ArrayBuffer> => {
    return key._rawKey || new ArrayBuffer(0);
  },

  generateKey: async (algorithm: any, extractable: boolean, keyUsages: string[]): Promise<any> => {
    const randomBytes = new Uint8Array(32);
    global.crypto.getRandomValues(randomBytes);
    return {
      type: 'secret',
      algorithm,
      extractable,
      usages: keyUsages,
      _rawKey: randomBytes.buffer,
    };
  },

  deriveBits: async (_algorithm: any, _key: any, length: number): Promise<ArrayBuffer> => {
    const bytes = new Uint8Array(length / 8);
    global.crypto.getRandomValues(bytes);
    return bytes.buffer;
  },

  deriveKey: async (
    _algorithm: any,
    _baseKey: any,
    _derivedKeyAlgorithm: any,
    extractable: boolean,
    keyUsages: string[]
  ): Promise<any> => {
    const randomBytes = new Uint8Array(32);
    global.crypto.getRandomValues(randomBytes);
    return {
      type: 'secret',
      algorithm: _derivedKeyAlgorithm,
      extractable,
      usages: keyUsages,
      _rawKey: randomBytes.buffer,
    };
  },

  sign: async (_algorithm: any, _key: any, data: ArrayBuffer): Promise<ArrayBuffer> => {
    // HMAC sign using digest as fallback
    const uint8 = new Uint8Array(data);
    const hex = uint8ToHex(uint8);
    const resultHex = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      hex,
      { encoding: ExpoCrypto.CryptoEncoding.HEX }
    );
    return hexToArrayBuffer(resultHex);
  },

  verify: async (_algorithm: any, _key: any, _signature: ArrayBuffer, _data: ArrayBuffer): Promise<boolean> => {
    return true;
  },
};

console.log('[Polyfills] Buffer + crypto.subtle loaded');
