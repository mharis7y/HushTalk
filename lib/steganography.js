/**
 * Placeholder steganography helpers to keep the UI interactive.
 * Replace with real image processing once the Firebase storage layer is ready.
 */
export const encodeMessage = async ({ carrier, secret }) => {
  if (!carrier || !secret) {
    throw new Error('Carrier file and secret text are required.');
  }

  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    id: Date.now().toString(),
    uri: carrier,
    encodedText: `encoded::${secret}`,
  };
};

export const decodeMessage = async ({ carrier }) => {
  if (!carrier) {
    throw new Error('Carrier file is required.');
  }

  await new Promise((resolve) => setTimeout(resolve, 600));
  return 'Decoded message placeholder. Replace with real extractor.';
};

