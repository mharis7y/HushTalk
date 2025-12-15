import { useState, useEffect } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Search, MessageCircle } from 'lucide-react-native';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const { user, preloadedUsers, preloadedChats } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState(preloadedUsers || []);
  const [loading, setLoading] = useState(!preloadedUsers || preloadedUsers.length === 0);
  const [chats, setChats] = useState(preloadedChats || []);

  useEffect(() => {
    if (!user) return;

    // Use preloaded data if available, otherwise fetch
    if (preloadedUsers && preloadedUsers.length > 0) {
      setUsers(preloadedUsers);
      setLoading(false);
    } else {
      // Fetch all users except current user
      const fetchUsers = async () => {
        try {
          const usersRef = collection(db, 'users');
          const querySnapshot = await getDocs(usersRef);
          const usersList = [];
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // Filter out current user
            if (userData.userId !== user.uid) {
              usersList.push({ id: doc.id, ...userData });
            }
          });
          setUsers(usersList);
        } catch (error) {
          console.error('Error fetching users:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }

    // Update chats from preloaded data or set up listener
    if (preloadedChats && preloadedChats.length >= 0) {
      setChats(preloadedChats);
    }

    // Set up realtime listener for chats
    let unsubscribeChats = null;
    try {
      const chatsRef = collection(db, 'chats');
      const userChatsQuery = query(
        chatsRef,
        where('participants', 'array-contains', user.uid)
      );
      unsubscribeChats = onSnapshot(userChatsQuery, (snapshot) => {
        const chatsList = [];
        snapshot.forEach((doc) => {
          chatsList.push({ id: doc.id, ...doc.data() });
        });
        setChats(chatsList);
      });
    } catch (error) {
      console.error('Error fetching chats:', error);
    }

    return () => {
      if (unsubscribeChats && typeof unsubscribeChats === 'function') {
        unsubscribeChats();
      }
    };
  }, [user, preloadedUsers, preloadedChats]);

  const handleUserPress = async (otherUser) => {
    if (!user) return;
    
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

  const filteredUsers = users.filter((u) => {
    const usernameMatch = u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = u.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());
  
    return usernameMatch || phoneMatch;
  });
  

  const displayData = searchQuery ? filteredUsers : users;

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
          placeholder="Search allies..."
          placeholderTextColor="#8D8DAA"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-black-100 rounded-2xl px-12 py-3 text-white font-poppins"
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9C01" />
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(item) => item.id || item.userId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            // Find chat with this user to get unread count
            const userChat = chats.find(chat => 
              chat.participants && chat.participants.includes(item.userId)
            );
            const unreadCounts = userChat?.unreadCounts || {};
            const unreadCount = unreadCounts[user?.uid] || 0;

            return (
              <Pressable
                onPress={() => handleUserPress(item)}
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
                  {unreadCount > 0 && (
                    <View className="w-6 h-6 bg-secondary-100 rounded-full items-center justify-center">
                      <Text className="text-black text-xs font-poppins_bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text className="text-center text-white/60 mt-20">
              {searchQuery ? 'No users found.' : 'No users available. Start a conversation!'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}


