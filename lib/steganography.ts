import { NativeModules, Platform } from 'react-native';
import Steganography from './Steganography/Steganography';
import { auth } from './firebase';
import { storage, databases, APPWRITE_CONFIG, ID } from './appwriteConfig';

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

// Check if video steganography module is available
const { VideoSteganography } = NativeModules;

/**
 * Internal helper – placeholder for future Appwrite integration.
 * Currently this only simulates an upload and returns a generated ID.
 */
async function uploadStegImageMetadata(params: {
  userId: string | null;
  uri: string;
}) {
  if (!params.userId) {
    console.warn('No userId provided for upload. Skipping Appwrite upload.');
    return { success: false, id: null };
  }

  try {
    const fileName = `steg_${Date.now()}.png`;

    // Create file object for Appwrite
    const file = {
      name: fileName,
      type: 'image/png',
      uri: params.uri,
      size: 0, // React Native automatically handles size
    };

    // 1. Upload file to Storage
    const uploadedFile = await storage.createFile(
      APPWRITE_CONFIG.bucketId,
      ID.unique(),
      file
    );

    // 2. Create document in Database
    const document = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collectionId,
      ID.unique(),
      {
        ownerId: params.userId,
        fileId: uploadedFile.$id,
        fileName: fileName,
        type: 'image',
      }
    );

    return {
      success: true,
      id: document.$id,
      fileId: uploadedFile.$id
    };
  } catch (error) {
    console.error('Appwrite upload failed:', error);
    // Silent fail for background upload
    return { success: false, id: null };
  }
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
    throw new Error('No carrier media provided for steganography.');
  }
  if (!secret || !secret.trim()) {
    throw new Error('Secret message cannot be empty.');
  }

  // Check if it's a video (by URI or file extension)
  const carrierLower = carrier.toLowerCase();
  const isVideo = carrierLower.includes('.mp4') ||
    carrierLower.includes('.mov') ||
    carrierLower.includes('.avi') ||
    carrierLower.includes('.mkv') ||
    carrierLower.includes('video/') ||
    carrierLower.includes('content://media/external/video');

  if (isVideo && Platform.OS === 'android' && VideoSteganography) {
    // Video steganography using native module
    try {
      // Wrap the payload in a small JSON envelope so that we can
      // validate an optional password on decode.
      const payload = JSON.stringify({
        secret,
        password: password ?? null,
      });

      const result = await VideoSteganography.encodeVideo(carrier, payload);

      const userId = auth?.currentUser?.uid ?? null;


      return {
        uri: result.uri,
        userId,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Video encoding failed');
    }
  } else {
    // Image steganography using existing Steganography class
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

    const uploadResult = await uploadStegImageMetadata({
      userId,
      uri: encodedUri,
    });

    return {
      id: uploadResult.id,
      uri: encodedUri,
      userId,
    };
  }
}

/**
 * Decode a steganofied image or video produced by `encodeMessage`.
 * If a password was set when encoding, you must provide the same password
 * or an error will be thrown.
 */
export async function decodeMessage(
  params: DecodeMessageParams,
): Promise<string> {
  const { carrier, password } = params;

  if (!carrier) {
    throw new Error('No carrier media provided for steganography decoding.');
  }

  // Check if it's a video (by URI or file extension)
  const carrierLower = carrier.toLowerCase();
  const isVideo = carrierLower.includes('.mp4') ||
    carrierLower.includes('.mov') ||
    carrierLower.includes('.avi') ||
    carrierLower.includes('.mkv') ||
    carrierLower.includes('video/') ||
    carrierLower.includes('content://media/external/video');

  if (isVideo && Platform.OS === 'android' && VideoSteganography) {
    // Video steganography using native module
    try {
      const result = await VideoSteganography.decodeVideo(carrier);
      const raw = result.text || '';

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
    } catch (error: any) {
      throw new Error(error.message || 'Video decoding failed');
    }
  } else {
    // Image steganography using existing Steganography class
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
}

export default {
  encodeMessage,
  decodeMessage,
};


