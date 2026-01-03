import Steganography from './Steganography/Steganography';
import { auth } from './firebase';

type EncodeMessageParams = {
  carrier: string;
  secret: string;
  password?: string;
};

type DecodeMessageParams = {
  carrier: string;
  password?: string;
};

type EncodeMessageResult = {
  id: string;
  uri: string;
  userId?: string | null;
};

/**
 * Internal helper – placeholder for future Appwrite integration.
 * Currently this only simulates an upload and returns a generated ID.
 */
async function uploadStegImageMetadataStub(params: {
  userId: string | null;
  uri: string;
  assetId?: string;
}) {
  // TODO: Replace this with real Appwrite write logic once backend is wired.
  // You will have access to userId here (from Firebase auth) and can
  // send the encoded image URI / Appwrite storage ID to your database.
  console.log('Stub Appwrite upload payload:', params);
  return {
    success: true,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  };
}

/**
 * Encode a secret message into an image using the LSBv1 algorithm,
 * save the encoded image into the user's gallery under the "HushTalk"
 * album, and prepare a stub "upload" to the (future) Appwrite database.
 */
export async function encodeMessage(
  params: EncodeMessageParams,
): Promise<EncodeMessageResult> {
  const { carrier, secret, password } = params;

  if (!carrier) {
    throw new Error('No carrier image provided for steganography.');
  }
  if (!secret || !secret.trim()) {
    throw new Error('Secret message cannot be empty.');
  }

  // Wrap the payload in a small JSON envelope so that we can
  // validate an optional password on decode.
  const payload = JSON.stringify({
    secret,
    password: password ?? null,
  });

  const steg = new Steganography(carrier);
  // BitmapModule.setPixels already saves the image to gallery, so we just get the URI
  const encodedUri = await steg.encode(payload, { algorithm: 'LSBv1' });
  

  const userId = auth?.currentUser?.uid ?? null;

  const uploadResult = await uploadStegImageMetadataStub({
    userId,
    uri: encodedUri,
  });

  return {
    id: uploadResult.id,
    uri: encodedUri,
    userId,
  };
}

/**
 * Decode a steganofied image produced by `encodeMessage`.
 * If a password was set when encoding, you must provide the same password
 * or an error will be thrown.
 */
export async function decodeMessage(
  params: DecodeMessageParams,
): Promise<string> {
  const { carrier, password } = params;

  if (!carrier) {
    throw new Error('No carrier image provided for steganography decoding.');
  }

  const steg = new Steganography(carrier);
  const raw = await steg.decode();

  try {
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object' && 'secret' in parsed) {
      const storedPassword = parsed.password ?? null;

      if (storedPassword && password && storedPassword !== password) {
        throw new Error('Invalid password for this hidden message.');
      }

      return parsed.secret as string;
    }

    // Fallback if payload is not in the expected envelope format.
    return raw;
  } catch {
    // If the payload is not valid JSON, just return the raw string.
    return raw;
  }
}

export default {
  encodeMessage,
  decodeMessage,
};


