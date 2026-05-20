import React, { createContext, useContext, useEffect, useState } from 'react';
import { getApp } from '@react-native-firebase/app';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  onSnapshot,
} from '@react-native-firebase/firestore';

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preloadedChats, setPreloadedChats] = useState([]);
  const [preloadedUsers, setPreloadedUsers] = useState([]);

  useEffect(() => {
    const auth = getAuth(getApp());
    const db = getFirestore(getApp());

    // onAuthStateChanged resolves instantly from the native persisted session.
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setIsLogged(true);

        const userDocRef = doc(db, 'users', authUser.uid);
        
        // Listen to the user document in realtime to catch the moment it is created during sign up
        unsubscribeUserDoc = onSnapshot(userDocRef, (userDocSnap) => {
          if (userDocSnap.exists) {
            setUser({
              uid: authUser.uid,
              email: authUser.email,
              displayName: authUser.displayName,
              ...userDocSnap.data(),
            });
          } else {
            // Fallback while the document is being created
            setUser({ 
              uid: authUser.uid, 
              email: authUser.email, 
              displayName: authUser.displayName 
            });
          }
        }, (error) => {
          console.error('Error listening to user Firestore data:', error);
        });

        // Preload chats and users in background (non-blocking)
        preloadData(authUser.uid, db);
      } else {
        setIsLogged(false);
        setUser(null);
        setPreloadedChats([]);
        setPreloadedUsers([]);
        
        if (unsubscribeUserDoc) {
          unsubscribeUserDoc();
          unsubscribeUserDoc = null;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const preloadData = async (userId, db) => {
    try {
      // Preload all other users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnapshot.forEach((docSnap) => {
        const userData = docSnap.data();
        if (userData.userId !== userId) {
          usersList.push({ id: docSnap.id, ...userData });
        }
      });
      setPreloadedUsers(usersList);

      // Subscribe to the user's chats in realtime
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );

      const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
        const chatsList = [];
        snapshot.forEach((docSnap) => {
          chatsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPreloadedChats(chatsList);
      });

      return unsubscribeChats;
    } catch (error) {
      console.error('Error preloading data:', error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        setIsLogged,
        user,
        setUser,
        loading,
        preloadedChats,
        preloadedUsers,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
