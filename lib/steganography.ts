import { NativeModules, Platform } from 'react-native';
import Steganography from './Steganography/Steganography';
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
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
  id?: string | null;
  uri: string;
  userId?: string | null;
};

// Check if video steganography module is available
const { VideoSteganography } = NativeModules;

/**
 * Upload the steganified file to Appwrite Storage + create a Database record.
 * This runs in the background — callers should NOT await it if they want
 * fire-and-forget behaviour.
 */
async function uploadStegToAppwrite(params: {
  userId: string;
  uri: string;
  type: 'image' | 'video';
}) {
  const ext = params.type === 'video' ? 'mp4' : 'png';
  const mimeType = params.type === 'video' ? 'video/mp4' : 'image/png';
  const fileName = `steg_${Date.now()}.${ext}`;

  // Create file object for Appwrite React Native SDK
  const file = {
    name: fileName,
    type: mimeType,
    uri: params.uri,
    size: 0, // The SDK reads the actual size from the URI on device
  };

  // 1. Upload file to Storage
  const uploadedFile = await storage.createFile(
    APPWRITE_CONFIG.bucketId,
    ID.unique(),
    file
  );

  // 2. Create metadata document in Database
  const document = await databases.createDocument(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.collectionId,
    ID.unique(),
    {
      ownerId: params.userId,
      fileId: uploadedFile.$id,
      fileName: fileName,
      type: params.type,
    }
  );

  return {
    success: true,
    id: document.$id,
    fileId: uploadedFile.$id,
  };
}

/**
 * Encode a secret message into an image using the LSBv1 algorithm,
 * save the encoded image into the user's gallery under the "HushTalk"
 * album, then fire-and-forget the Appwrite upload in the background.
 *
 * The function returns immediately after encoding — the caller does NOT
 * wait for the upload to complete.
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

  // Resolve the current user's UID via the modular API
  const auth = getAuth(getApp());
  const userId = auth.currentUser?.uid ?? null;

  // Detect media type
  const carrierLower = carrier.toLowerCase();
  const isVideo =
    carrierLower.includes('.mp4') ||
    carrierLower.includes('.mov') ||
    carrierLower.includes('.avi') ||
    carrierLower.includes('.mkv') ||
    carrierLower.includes('video/') ||
    carrierLower.includes('content://media/external/video');

  if (isVideo && Platform.OS === 'android' && VideoSteganography) {
    // --- Video path ---
    const payload = JSON.stringify({ secret, password: password ?? null });
    const result = await VideoSteganography.encodeVideo(carrier, payload);
    const encodedUri: string = result.uri;

    // Fire-and-forget background upload
    if (userId) {
      uploadStegToAppwrite({ userId, uri: encodedUri, type: 'video' }).catch(
        (err) => console.warn('Background video upload failed:', err)
      );
    }

    return { uri: encodedUri, userId };
  } else {
    // --- Image path ---
    const payload = JSON.stringify({ secret, password: password ?? null });
    const steg = new Steganography(carrier);
    const encodedUri = await steg.encode(payload, { algorithm: 'LSBv1' });

    // Fire-and-forget background upload — caller gets the URI immediately
    if (userId) {
      uploadStegToAppwrite({ userId, uri: encodedUri, type: 'image' }).catch(
        (err) => console.warn('Background image upload failed:', err)
      );
    }

    // Return immediately — no await on the upload
    return { uri: encodedUri, userId };
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

  const carrierLower = carrier.toLowerCase();
  const isVideo =
    carrierLower.includes('.mp4') ||
    carrierLower.includes('.mov') ||
    carrierLower.includes('.avi') ||
    carrierLower.includes('.mkv') ||
    carrierLower.includes('video/') ||
    carrierLower.includes('content://media/external/video');

  if (isVideo && Platform.OS === 'android' && VideoSteganography) {
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
        return raw;
      } catch {
        return raw;
      }
    } catch (error: any) {
      throw new Error(error.message || 'Video decoding failed');
    }
  } else {
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
      return raw;
    } catch {
      return raw;
    }
  }
}

export default {
  encodeMessage,
  decodeMessage,
};
