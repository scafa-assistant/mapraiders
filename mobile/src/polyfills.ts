// This file MUST be imported before any other imports in the app entry point.
// Web3Auth requires Buffer, crypto.getRandomValues, and crypto.subtle (full WebCrypto API)
// which don't exist in React Native's Hermes engine.

import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Buffer polyfill
global.Buffer = global.Buffer || Buffer;

// Full WebCrypto polyfill (crypto.subtle with encrypt, decrypt, digest, importKey, etc.)
// Required by Web3Auth SDK
import crypto from 'isomorphic-webcrypto';

if (typeof global.crypto === 'undefined') {
  (global as any).crypto = crypto;
} else {
  if (!global.crypto.subtle) {
    (global.crypto as any).subtle = crypto.subtle;
  }
}
