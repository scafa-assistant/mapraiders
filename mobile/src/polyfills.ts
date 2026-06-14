// Polyfills for React Native
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
(global as any).Buffer = Buffer;

// ---------------------------------------------------------------------------
// UTF-16LE TextDecoder polyfill (fixes immediate Hermes/Expo release crash)
// ---------------------------------------------------------------------------
// Expo's "winter" runtime installs a global `TextDecoder` that ONLY supports
// UTF-8 (see node_modules/expo/src/winter/TextDecoder.ts — its own comment:
// "Incomplete as we only need TextDecoder utf8 in Expo RSC"). Constructing
// `new TextDecoder('utf-16le')` therefore throws:
//   RangeError: Unknown encoding: utf-16le (normalized: utf-16le)
// Some dependency performs a charset/BOM-sniffing decode at module-import
// time and asks for utf-16le, which aborts the whole app on launch in the
// Hermes release bundle (it does not fire in Expo Go / dev because a more
// complete TextDecoder is available there).
//
// Strategy: feature-detect. Only if the existing global TextDecoder rejects
// 'utf-16le' do we wrap it so that utf-16le / utf16le / ucs2 / ucs-2 are
// handled by a small manual decoder. Every other label (utf-8, etc.) is
// delegated unchanged to the original implementation. UTF-8 behaviour is
// never touched.
// ---------------------------------------------------------------------------
(function installUtf16leTextDecoder() {
  const g = global as any;
  const OriginalTextDecoder = g.TextDecoder;
  if (typeof OriginalTextDecoder !== 'function') {
    return; // nothing to patch
  }

  // Feature-detect: does the current TextDecoder already accept utf-16le?
  let needsPatch = false;
  try {
    // eslint-disable-next-line no-new
    new OriginalTextDecoder('utf-16le');
  } catch {
    needsPatch = true;
  }
  if (!needsPatch) {
    return; // already supported — leave as-is
  }

  const UTF16LE_LABELS = new Set([
    'utf-16le',
    'utf16le',
    'ucs2',
    'ucs-2',
    'unicodefffe',
    'csunicode',
  ]);

  const normalizeLabel = (label: unknown): string =>
    String(label === undefined ? 'utf-8' : label).trim().toLowerCase();

  // Convert a byte view into a JS string assuming little-endian UTF-16.
  const decodeUtf16le = (input?: ArrayBuffer | ArrayBufferView): string => {
    if (input == null) return '';
    let bytes: Uint8Array;
    if (input instanceof Uint8Array) {
      bytes = input;
    } else if (ArrayBuffer.isView(input)) {
      bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    } else {
      bytes = new Uint8Array(input as ArrayBuffer);
    }
    let result = '';
    // Build in chunks to avoid call-stack limits on String.fromCharCode.
    const CHUNK = 0x8000;
    const units: number[] = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      units.push(bytes[i] | (bytes[i + 1] << 8));
      if (units.length >= CHUNK) {
        result += String.fromCharCode.apply(null, units);
        units.length = 0;
      }
    }
    if (units.length) {
      result += String.fromCharCode.apply(null, units);
    }
    return result;
  };

  class PatchedTextDecoder {
    private _native: any | null = null;
    private _utf16le = false;
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;

    constructor(label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean }) {
      const normalized = normalizeLabel(label);
      this.fatal = !!(options && options.fatal);
      this.ignoreBOM = !!(options && options.ignoreBOM);
      if (UTF16LE_LABELS.has(normalized)) {
        this._utf16le = true;
        this.encoding = 'utf-16le';
      } else {
        // Delegate to the original implementation for everything else.
        this._native = new OriginalTextDecoder(label as any, options as any);
        this.encoding = this._native.encoding;
      }
    }

    decode(input?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string {
      if (this._utf16le) {
        let out = decodeUtf16le(input);
        // Strip a leading BOM (U+FEFF) unless ignoreBOM was requested.
        if (!this.ignoreBOM && out.charCodeAt(0) === 0xfeff) {
          out = out.slice(1);
        }
        return out;
      }
      return this._native.decode(input as any, options as any);
    }
  }

  g.TextDecoder = PatchedTextDecoder;
})();
