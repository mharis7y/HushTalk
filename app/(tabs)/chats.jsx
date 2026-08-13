import { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Search, MessageCircle, Plus, X } from 'lucide-react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  onSnapshot,
} from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decryptMessage } from '../../lib/crypto';

const CHATS_CACHE_KEY = (uid) => `@hushtalk_chats_${uid}`;
const CHAT_USERS_CACHE_KEY = (uid) => `@hushtalk_chat_users_${uid}`;

export default function ChatsScreen() {
  const { user } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations State — initialised from cache so the list appears instantly
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // User Data Cache
  const [chatUsers, setChatUsers] = useState({});
  const chatUserCache = useRef({});

  // Modal State — privacy-first: no listing of all users
  const [modalVisible, setModalVisible] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  // ─── Hydrate from cache on mount, then subscribe to live updates ──────────
  useEffect(() => {
    if (!user?.uid) return;

    const db = getFirestore(getApp());

    // 1. Load cached chats & users instantly so the list renders immediately
    const loadCache = async () => {
      try {
        const [cachedChatsStr, cachedUsersStr] = await Promise.all([
          AsyncStorage.getItem(CHATS_CACHE_KEY(user.uid)),
          AsyncStorage.getItem(CHAT_USERS_CACHE_KEY(user.uid)),
        ]);
        if (cachedChatsStr) {
          setChats(JSON.parse(cachedChatsStr));
          setLoadingChats(false); // show cached data immediately, no spinner
        }
        if (cachedUsersStr) {
          const parsed = JSON.parse(cachedUsersStr);
          chatUserCache.current = parsed;
          setChatUsers(parsed);
        }
      } catch (_) {}
    };
    loadCache();

    // 2. Subscribe to Firestore — updates arrive in the background and persist
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsList = [];
      const missingUserIds = new Set();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        chatsList.push({ id: docSnap.id, ...data });

        const otherUserId = data.participants?.find((id) => id !== user.uid);
        if (otherUserId && !chatUserCache.current[otherUserId]) {
          missingUserIds.add(otherUserId);
        }
      });

      // Sort newest-first
      chatsList.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessageTime || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setChats(chatsList);
      setLoadingChats(false);

      // Fetch uncached users
      if (missingUserIds.size > 0) {
        for (const uid of missingUserIds) {
          const usersSnapshot = await getDocs(
            query(collection(db, 'users'), where('userId', '==', uid))
          );
          if (!usersSnapshot.empty) {
            chatUserCache.current[uid] = usersSnapshot.docs[0].data();
          }
        }
      }
      const updatedUsers = { ...chatUserCache.current };
      setChatUsers(updatedUsers);

      // 3. Persist updated data to AsyncStorage
      try {
        await Promise.all([
          AsyncStorage.setItem(CHATS_CACHE_KEY(user.uid), JSON.stringify(chatsList)),
          AsyncStorage.setItem(CHAT_USERS_CACHE_KEY(user.uid), JSON.stringify(updatedUsers)),
        ]);
      } catch (_) {}
    });

    return () => unsubscribeChats();
  }, [user?.uid]);

  /**
   * Privacy-first user search — only queries on exact 11-digit phone number.
   */
  const handlePhoneSearch = async (phoneNumber) => {
    setUserSearchQuery(phoneNumber);
    setSearchResult(null);
    setSearchAttempted(false);

    if (phoneNumber.length !== 11 || !/^\d{11}$/.test(phoneNumber)) return;

    const db = getFirestore(getApp());
    setLoadingSearch(true);
    setSearchAttempted(true);
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber))
      );
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        setSearchResult(userData.userId !== user.uid
          ? { id: usersSnapshot.docs[0].id, ...userData }
          : null);
      } else {
        setSearchResult(null);
      }
    } catch (error) {
      console.error('Error searching for user:', error);
      setSearchResult(null);
    } finally {
      setLoadingSearch(false);
    }
  };

  const openNewChatModal = () => {
    setModalVisible(true);
    setUserSearchQuery('');
    setSearchResult(null);
    setSearchAttempted(false);
  };

  const handleStartChat = async (otherUser) => {
    if (!user?.uid) return;
    setModalVisible(false);

    const db = getFirestore(getApp());
    const chatId = [user.uid, otherUser.userId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);

    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, otherUser.userId],
        createdAt: new Date().toISOString(),
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
      });
    }

    router.push(`/chat/${chatId}`);
  };

  const handleChatPress = (chatId) => router.push(`/chat/${chatId}`);

  const filteredChats = chats.filter((chat) => {
    const otherUserId = chat.participants?.find((id) => id !== user?.uid);
    const otherUser = chatUsers[otherUserId];
    if (!searchQuery) return true; // show all chats when not searching
    if (!otherUser) return false; // hide only when searching and user data is missing
    const usernameMatch = otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = otherUser.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return usernameMatch || phoneMatch;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary px-6 pt-5">
      <View className="flex-row items-center gap-2 mb-2">
        <MessageCircle size={28} color="#FF9C01" />
        <Text className="text-3xl text-white font-poppins_bold">Chats</Text>
      </View>
      <Text className="text-white/60 mb-6 font-poppins">
        Connect locally, stay resilient globally.
      </Text>

      <View className="relative mb-6">
        <View className="absolute left-4 top-3 z-10">
          <Search size={20} color="#8D8DAA" />
        </View>
        <TextInput
          placeholder="Search conversations..."
          placeholderTextColor="#8D8DAA"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-black-100 rounded-2xl px-12 py-3 text-white font-poppins"
        />
      </View>

      {loadingChats ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9C01" />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => {
            const otherUserId = item.participants?.find((id) => id !== user?.uid);
            const otherUser = chatUsers[otherUserId];
            const unreadCounts = item.unreadCounts || {};
            const unreadCount = unreadCounts[user?.uid] || 0;

            return (
              <Pressable
                onPress={() => handleChatPress(item.id)}
                className="bg-black-200 rounded-3xl p-4 mb-4 border border-transparent active:border-secondary-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center">
                    <Text className="text-white text-lg font-poppins_bold">
                      {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-lg text-white font-poppins_semibold">
                        {otherUser?.username || 'Unknown User'}
                      </Text>
                      <Text className="text-white/40 text-xs font-poppins">
                        {formatTime(item.lastMessageTime || item.createdAt)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between items-center mt-1">
                      <Text
                        className="text-white/60 text-sm font-poppins flex-1 mr-2"
                        numberOfLines={1}
                      >
                        {item.lastMessage
                          ? item.isEncrypted === 1
                            ? decryptMessage(item.lastMessage)
                            : item.lastMessage
                          : 'Start a conversation'}
                      </Text>
                      {unreadCount > 0 && (
                        <View className="w-6 h-6 bg-secondary-100 rounded-full items-center justify-center">
                          <Text className="text-black text-xs font-poppins_bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text className="text-center text-white/60 mt-20">
              {searchQuery ? 'No chats match your search.' : 'No conversations yet. Start one!'}
            </Text>
          }
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={openNewChatModal}
        className="absolute bottom-6 right-6 w-14 h-14 bg-secondary-100 rounded-full items-center justify-center shadow-lg active:opacity-80"
      >
        <Plus color="#161622" size={24} strokeWidth={3} />
      </Pressable>

      {/* New Chat Modal — privacy-first exact-phone search */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-primary pt-12 px-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl text-white font-poppins_bold">New Chat</Text>
            <Pressable onPress={() => setModalVisible(false)} className="p-2">
              <X color="#FFFFFF" size={24} />
            </Pressable>
          </View>

          <Text className="text-white/50 text-sm font-poppins mb-4">
            Enter an exact 11-digit phone number to find a user.
          </Text>

          <View className="relative mb-6">
            <View className="absolute left-4 top-3 z-10">
              <Search size={20} color="#8D8DAA" />
            </View>
            <TextInput
              placeholder="03xxxxxxxxx"
              placeholderTextColor="#8D8DAA"
              value={userSearchQuery}
              onChangeText={handlePhoneSearch}
              keyboardType="phone-pad"
              maxLength={11}
              className="bg-black-100 rounded-2xl px-12 py-3 text-white font-poppins"
            />
          </View>

          {loadingSearch ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF9C01" />
            </View>
          ) : searchResult ? (
            <Pressable
              onPress={() => handleStartChat(searchResult)}
              className="bg-black-200 rounded-3xl p-4 mb-4 border border-transparent active:border-secondary-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center">
                  <Text className="text-white text-lg font-poppins_bold">
                    {searchResult.username?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-lg text-white font-poppins_semibold">
                    {searchResult.username || 'Unknown User'}
                  </Text>
                  <Text className="text-white/60 text-sm mt-1 font-poppins">
                    {searchResult.phoneNumber || ''}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : searchAttempted && userSearchQuery.length === 11 ? (
            <Text className="text-center text-white/60 mt-10 font-poppins">
              No user found with that phone number.
            </Text>
          ) : (
            <Text className="text-center text-white/30 mt-10 font-poppins">
              {userSearchQuery.length > 0 && userSearchQuery.length < 11
                ? `${11 - userSearchQuery.length} more digit${11 - userSearchQuery.length !== 1 ? 's' : ''} needed`
                : 'Enter a phone number above to search'}
            </Text>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
