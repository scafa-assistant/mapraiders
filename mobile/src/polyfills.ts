// This file MUST be imported before any other imports in the app entry point.
// Web3Auth requires Buffer, crypto.getRandomValues, and crypto.subtle
// which don't exist in React Native's Hermes engine.
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';

// Buffer polyfill
global.Buffer = global.Buffer || Buffer;

// crypto.subtle polyfill for Web3Auth (needs digest)
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}
if (!global.crypto.subtle) {
  (global.crypto as any).subtle = {
    digest: async (algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
      const algo = typeof algorithm === 'string'
        ? algorithm.replace('-', '').toLowerCase()
        : (algorithm as any).name?.replace('-', '').toLowerCase() || 'sha256';

      const mapping: Record<string, ExpoCrypto.CryptoDigestAlgorithm> = {
        sha1: ExpoCrypto.CryptoDigestAlgorithm.SHA1,
        sha256: ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        sha384: ExpoCrypto.CryptoDigestAlgorithm.SHA384,
        sha512: ExpoCrypto.CryptoDigestAlgorithm.SHA512,
      };

      const expoAlgo = mapping[algo] || ExpoCrypto.CryptoDigestAlgorithm.SHA256;
      const uint8 = new Uint8Array(data);
      const hex = await ExpoCrypto.digestStringAsync(
        expoAlgo,
        Array.from(uint8).map(b => String.fromCharCode(b)).join(''),
        { encoding: ExpoCrypto.CryptoEncoding.HEX }
      );

      // Convert hex string back to ArrayBuffer
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes.buffer;
    },
  };
}
