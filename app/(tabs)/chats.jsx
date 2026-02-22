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
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const { user } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Conversations State
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // User Data Cache
  const [chatUsers, setChatUsers] = useState({});
  const chatUserCache = useRef({});

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch and Listen to Chats
  useEffect(() => {
    if (!user) return;

    const chatsRef = collection(db, 'chats');
    const userChatsQuery = query(
      chatsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribeChats = onSnapshot(userChatsQuery, async (snapshot) => {
      const chatsList = [];
      const missingUserIds = new Set();

      snapshot.forEach((doc) => {
        const data = doc.data();
        chatsList.push({ id: doc.id, ...data });

        const otherUserId = data.participants?.find((id) => id !== user.uid);
        if (otherUserId && !chatUserCache.current[otherUserId]) {
          missingUserIds.add(otherUserId);
        }
      });

      // Sort chats by latest message timestamp descending
      chatsList.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
        return timeB - timeA;
      });

      setChats(chatsList);

      // Fetch any users we don't have yet
      if (missingUserIds.size > 0) {
        const fetchedUsers = {};
        for (const uid of missingUserIds) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('userId', '==', uid));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            fetchedUsers[uid] = querySnapshot.docs[0].data();
            chatUserCache.current[uid] = fetchedUsers[uid];
          }
        }
        setChatUsers({ ...chatUserCache.current });
      } else {
        setChatUsers({ ...chatUserCache.current });
      }
      setLoadingChats(false);
    });

    return () => unsubscribeChats();
  }, [user]);

  // Handle Opening Modal
  const openNewChatModal = async () => {
    setModalVisible(true);
    if (allUsers.length === 0) {
      setLoadingUsers(true);
      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const usersList = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.userId !== user.uid) {
            usersList.push({ id: doc.id, ...userData });
          }
        });
        setAllUsers(usersList);
      } catch (error) {
        console.error('Error fetching users for modal:', error);
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleStartChat = async (otherUser) => {
    if (!user) return;
    setModalVisible(false);

    // Create or get chat room
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

  const handleChatPress = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  // Filter existing chats based on search query
  const filteredChats = chats.filter((chat) => {
    const otherUserId = chat.participants?.find((id) => id !== user.uid);
    const otherUser = chatUsers[otherUserId];

    if (!otherUser) return false;

    const usernameMatch = otherUser.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = otherUser.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    return usernameMatch || phoneMatch;
  });

  // Filter modal users based on user search query
  const filteredAllUsers = allUsers.filter((u) => {
    const usernameMatch = u.username?.toLowerCase().includes(userSearchQuery.toLowerCase());
    const phoneMatch = u.phoneNumber?.toLowerCase().includes(userSearchQuery.toLowerCase());

    return usernameMatch || phoneMatch;
  });

  // Format time util
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
        <Text className="text-3xl text-white font-poppins_bold">
          Chats
        </Text>
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
                        {item.lastMessage || 'Start a conversation'}
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

      {/* New Chat Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-primary pt-12 px-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl text-white font-poppins_bold">
              New Chat
            </Text>
            <Pressable onPress={() => setModalVisible(false)} className="p-2">
              <X color="#FFFFFF" size={24} />
            </Pressable>
          </View>

          <View className="relative mb-6">
            <View className="absolute left-4 top-3 z-10">
              <Search size={20} color="#8D8DAA" />
            </View>
            <TextInput
              placeholder="Search available users..."
              placeholderTextColor="#8D8DAA"
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
              className="bg-black-100 rounded-2xl px-12 py-3 text-white font-poppins"
            />
          </View>

          {loadingUsers ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF9C01" />
            </View>
          ) : (
            <FlatList
              data={filteredAllUsers}
              keyExtractor={(item) => item.id || item.userId}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleStartChat(item)}
                  className="bg-black-200 rounded-3xl p-4 mb-4 border border-transparent active:border-secondary-100"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center">
                      <Text className="text-white text-lg font-poppins_bold">
                        {item.username?.[0]?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg text-white font-poppins_semibold">
                        {item.username || 'Unknown User'}
                      </Text>
                      <Text className="text-white/60 text-sm mt-1 font-poppins">
                        {item.phoneNumber || ''}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="text-center text-white/60 mt-10">
                  {userSearchQuery ? 'No users found.' : 'No other users available.'}
                </Text>
              }
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
