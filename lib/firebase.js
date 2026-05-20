/**
 * firebase.js — @react-native-firebase v22+ Modular API
 *
 * Native initialization is handled automatically via google-services.json.
 * We use the modular API (getAuth, getFirestore, etc.) per the v22 migration guide.
 * See: https://rnfirebase.io/migrating-to-v22
 */
import { getApp } from '@react-native-firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
} from '@react-native-firebase/firestore';

// Modular service getters (used directly or exported for other files)
export const getFirebaseAuth = () => getAuth(getApp());
export const getFirebaseDb = () => getFirestore(getApp());

// Convenience collection references
export const userRef = () => collection(getFirestore(getApp()), 'users');
export const roomRef = () => collection(getFirestore(getApp()), 'rooms');

/**
 * Register a new user with email/password, set their display name,
 * and create a Firestore user document.
 */
export async function createUser(email, password, username, phoneNumber) {
  try {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: username });

    await setDoc(doc(db, 'users', newUser.uid), {
      username,
      userId: newUser.uid,
      email: newUser.email,
      phoneNumber,
      createdAt: new Date().toISOString(),
      isPremium: 0,
    });

    return { success: true, data: newUser };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(email, password) {
  try {
    const auth = getAuth(getApp());
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, data: userCredential.user };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function signOut() {
  try {
    const auth = getAuth(getApp());
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}

/**
 * Send a password reset email to the given address.
 */
export async function resetPassword(email) {
  try {
    const auth = getAuth(getApp());
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, msg: error.message };
  }
}

/**
 * Permanently delete the authenticated user's account and all their
 * Firestore data. Required for Google Play's User Data policy.
 */
export async function deleteAccount(currentPassword) {
  try {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());
    const currentUser = auth.currentUser;

    if (!currentUser || !currentUser.email) {
      return { success: false, msg: 'Not authenticated' };
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);

    const uid = currentUser.uid;

    // Delete all chats the user participates in
    const chatsSnapshot = await getDocs(
      query(collection(db, 'chats'), where('participants', 'array-contains', uid))
    );

    const batch = writeBatch(db);
    chatsSnapshot.forEach((docSnap) => batch.delete(docSnap.ref));
    batch.delete(doc(db, 'users', uid));
    await batch.commit();

    await deleteUser(currentUser);
    return { success: true };
  } catch (error) {
    let msg = error.message || 'Failed to delete account';
    if (error.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
    if (error.code === 'auth/requires-recent-login') msg = 'Please sign in again and retry.';
    return { success: false, msg };
  }
}
