// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {getReactNativePersistence, initializeAuth, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNml1eRXR9uUd-3JZEQaaiUfGeOqERaGc",
  authDomain: "hushtalk-f58ba.firebaseapp.com",
  projectId: "hushtalk-f58ba",
  storageBucket: "hushtalk-f58ba.firebasestorage.app",
  messagingSenderId: "375488591914",
  appId: "1:375488591914:web:4c8e4aaa7d18cb3b33ab53"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth only if not already initialized
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

export const  db = getFirestore(app);
export const  userRef = collection(db, 'users');
export const  roomRef = collection(db, 'rooms');

export async function createUser(email, password, username, phoneNumber) {
  try {
    const newAccount = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(newAccount?.user, {
        displayName: username});

    await setDoc(doc(db, 'users', newAccount?.user?.uid), {
      username,
      userId: newAccount?.user?.uid,
      email: newAccount?.user?.email,
      phoneNumber: phoneNumber,
      createdAt: new Date().toISOString()
    });
    return {success: true, data: newAccount?.user};
  } catch (error) {
    return {success: false, msg: error.message};
  }
}

// Sign In
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {success: true, data: userCredential?.user};
  } catch (error) {
    return {success: false, msg: error.message};
  }
}

// Sign Out
export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return {success: true};
  } catch (error) {
    return {success: false, msg: error.message};
  }
}
  


