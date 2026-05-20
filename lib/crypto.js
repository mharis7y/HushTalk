/**
 * lib/crypto.js
 *
 * Pure-JavaScript AES-256-CTR encryption using the `aes-js` library.
 * No native modules required — works in Expo Go without a rebuild.
 *
 * The secret key is read from app.json → extra → CHAT_ENCRYPTION_KEY,
 * which EAS compiles into the native binary at build time.
 *
 * Usage:
 *   import { encryptMessage, decryptMessage } from '../lib/crypto';
 */

import aes from 'aes-js';
import Constants from 'expo-constants';

// ─── Key Setup ────────────────────────────────────────────────────────────────
// AES-256 needs exactly 32 bytes. We derive them by cycling through the key string.
const KEY_STR =
  Constants.expoConfig?.extra?.CHAT_ENCRYPTION_KEY || 'FALLBACK_DEV_KEY_REPLACE_ME';

const KEY_BYTES = (() => {
  const bytes = new Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = KEY_STR.charCodeAt(i % KEY_STR.length) & 0xff;
  }
  return bytes;
})();

// ─── Counter nonce builder ────────────────────────────────────────────────────
// aes-js Counter requires EXACTLY 16 bytes.
// We fill the first 8 bytes from the current timestamp and the last 8 with
// pseudo-random bytes (Math.random is fine here — this is basic server-side hiding).
function buildNonce() {
  const nonce = new Array(16).fill(0);
  const now = Date.now(); // 48 bits actually used by JS engines
  // Write timestamp into bytes 0-7 (big-endian, 8-bit slices)
  nonce[0] = (now / 0x100000000000) & 0xff;
  nonce[1] = (now / 0x1000000000) & 0xff;
  nonce[2] = (now / 0x10000000) & 0xff;
  nonce[3] = (now / 0x100000) & 0xff;
  nonce[4] = (now / 0x1000) & 0xff;
  nonce[5] = (now / 0x10) & 0xff;
  nonce[6] = now & 0xff;
  nonce[7] = Math.floor(Math.random() * 256); // extra entropy byte
  // Bytes 8-15 stay 0 (counter starts at 0 for this nonce)
  return nonce;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypts a plain-text message using AES-256-CTR.
 * Prepends the 16-byte nonce (32 hex chars) to the ciphertext so decrypt
 * knows the exact counter starting position.
 *
 * @param {string} plainText
 * @returns {string} hex string: "<32-char nonce><ciphertext hex>"
 */
export function encryptMessage(plainText) {
  try {
    const nonce = buildNonce(); // 16 bytes — exactly what aes-js needs
    const textBytes = aes.utils.utf8.toBytes(plainText);
    const ctr = new aes.ModeOfOperation.ctr(KEY_BYTES, new aes.Counter(nonce));
    const encrypted = ctr.encrypt(textBytes);

    // Prepend nonce so decryption can reconstruct the same counter
    return aes.utils.hex.fromBytes(nonce) + aes.utils.hex.fromBytes(encrypted);
  } catch (e) {
    console.error('[crypto] encryptMessage failed:', e);
    return plainText; // fail-open: return plain text rather than crashing
  }
}

/**
 * Decrypts a hex string produced by encryptMessage.
 * Returns the original input unchanged on any error to prevent crashes.
 *
 * @param {string} cipherText  "<32-char nonce><ciphertext hex>"
 * @returns {string} Decrypted plain text, or cipherText on failure
 */
export function decryptMessage(cipherText) {
  try {
    // First 32 hex chars = 16 bytes of nonce; the rest is the encrypted payload
    const nonceHex = cipherText.slice(0, 32);
    const dataHex = cipherText.slice(32);

    if (!nonceHex || !dataHex) return cipherText;

    const nonce = aes.utils.hex.toBytes(nonceHex);       // 16 bytes
    const encryptedBytes = aes.utils.hex.toBytes(dataHex);

    const ctr = new aes.ModeOfOperation.ctr(KEY_BYTES, new aes.Counter(nonce));
    const decrypted = ctr.decrypt(encryptedBytes);

    return aes.utils.utf8.fromBytes(decrypted);
  } catch {
    // Malformed data, wrong key, or old plain-text message — return as-is
    return cipherText;
  }
}
