import { Platform, Alert, Linking } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  Permission,
} from 'react-native-permissions';

/**
 * Request all necessary permissions at app launch
 * This ensures the app has all required permissions before user starts using features
 */
export async function requestAllPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true; // iOS permissions handled as needed
  }

  const permissionsToRequest: Permission[] = [];

  // Android 13+ (API 33+) uses granular media permissions
  if (Platform.Version >= 33) {
    permissionsToRequest.push(
      PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
      PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
    );
  } else {
    // Android 12 and below use READ_EXTERNAL_STORAGE
    permissionsToRequest.push(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
  }

  // WRITE_EXTERNAL_STORAGE is only needed for Android 9 (API 28) and below
  if (Platform.Version <= 28) {
    permissionsToRequest.push(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
  }

  try {
    const results = await Promise.all(
      permissionsToRequest.map(async (permission) => {
        const status = await check(permission);
        if (status === RESULTS.GRANTED) {
          return { permission, granted: true };
        }
        // If not granted, request it
        const requestResult = await request(permission);
        return {
          permission,
          granted: requestResult === RESULTS.GRANTED,
          status: requestResult,
        };
      })
    );

    // Double check: sometimes the result status needs a moment or a re-check
    const finalCheck = await Promise.all(
      results.map(async (r) => {
        if (r.granted) return r;
        const recheck = await check(r.permission);
        return {
          ...r,
          granted: recheck === RESULTS.GRANTED,
          status: recheck,
        };
      })
    );

    const allGranted = finalCheck.every((r) => r.granted);
    const denied = finalCheck.filter((r) => !r.granted);

    // Log for debugging
    console.log('Final Permission Results:', finalCheck);

    if (!allGranted && denied.length > 0) {
      // Only show alert if permissions are permanently denied/blocked.
      // We accept a soft 'denied' without pestering.
      const shouldShowAlert = denied.some(d => d.status === RESULTS.BLOCKED);

      if (shouldShowAlert) {
        const deniedNames = denied.map((d) => d.permission.split('.').pop()).join(', ');
        Alert.alert(
          'Permissions Required',
          `The app needs the following permissions to function properly: ${deniedNames}. Please allow them in Settings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => Linking.openSettings(),
            },
          ]
        );
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Check if we have media permissions
 */
export async function hasMediaPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (Platform.Version >= 33) {
      const images = await check(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      const videos = await check(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
      return images === RESULTS.GRANTED && videos === RESULTS.GRANTED;
    } else {
      const storage = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      return storage === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error checking media permissions:', error);
    return false;
  }
}

/**
 * Request media permissions if not already granted
 */
export async function requestMediaPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    if (Platform.Version >= 33) {
      const imagesStatus = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      const videosStatus = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
      return (
        imagesStatus === RESULTS.GRANTED && videosStatus === RESULTS.GRANTED
      );
    } else {
      const storageStatus = await request(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      return storageStatus === RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    return false;
  }
}
