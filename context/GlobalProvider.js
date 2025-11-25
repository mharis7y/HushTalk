import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preloadedChats, setPreloadedChats] = useState([]);
  const [preloadedUsers, setPreloadedUsers] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLogged(true);
        setUser(user);
        // Preload chats and users in background
        preloadData(user.uid);
      } else {
        setIsLogged(false);
        setUser(null);
        setPreloadedChats([]);
        setPreloadedUsers([]);
      }
      setLoading(false);
    });
    
    return unsub;
  }, []);

  const preloadData = async (userId) => {
    try {
      // Preload users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList = [];
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.userId !== userId) {
          usersList.push({ id: doc.id, ...userData });
        }
      });
      setPreloadedUsers(usersList);

      // Preload chats
      const chatsRef = collection(db, 'chats');
      const userChatsQuery = query(
        chatsRef,
        where('participants', 'array-contains', userId)
      );
      const unsubscribeChats = onSnapshot(userChatsQuery, (snapshot) => {
        const chatsList = [];
        snapshot.forEach((doc) => {
          chatsList.push({ id: doc.id, ...doc.data() });
        });
        setPreloadedChats(chatsList);
      });
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
