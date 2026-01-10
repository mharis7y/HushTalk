import { useEffect, useState, useCallback } from 'react';
import { FlatList, Text, View, Pressable, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MessageCircle, Image as ImageIcon, Clock, Users, Lock } from 'lucide-react-native';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, } from 'firebase/firestore';
import { Query } from 'react-native-appwrite';
import Header from '../../components/Header';
import AppButton from '../../components/AppButton';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, APPWRITE_CONFIG } from '../../lib/appwriteConfig';

export default function HomeScreen() {
  const { user, preloadedChats } = useGlobalContext();
  const [recentChats, setRecentChats] = useState([]);
  const [recentVaultItems, setRecentVaultItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchRecentChats(), fetchRecentVaultItems()]);
    setRefreshing(false);
  }, [user, preloadedChats]);

  // Fetch Recent Chats
  const fetchRecentChats = async () => {
    if (!user || !preloadedChats) return;
    try {
      const chatsWithUsers = await Promise.all(
        preloadedChats.slice(0, 3).map(async (chat) => {
          const otherUserId = chat.participants.find((id) => id !== user.uid);
          if (!otherUserId) return null;

          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('userId', '==', otherUserId));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            return {
              id: chat.id,
              name: userData.username || 'Unknown User',
              lastMessage: chat.lastMessage || 'No messages yet',
              timestamp: chat.lastMessageTime
                ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now',
            };
          }
          return null;
        })
      );
      setRecentChats(chatsWithUsers.filter(Boolean));
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    }
  };

  // Fetch Recent Vault Items
  const fetchRecentVaultItems = async () => {
    if (!user) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionId,
        [
          Query.equal('ownerId', user.uid),
          Query.orderDesc('$createdAt'),
          Query.limit(3)
        ]
      );

      const items = response.documents.map(doc => ({
        id: doc.$id,
        title: doc.fileName,
        fileType: doc.type,
        createdAt: new Date(doc.$createdAt).toLocaleDateString(),
      }));
      setRecentVaultItems(items);
    } catch (error) {
      console.error('Error fetching recent vault items:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentVaultItems();
    }, [user])
  );

  useEffect(() => {
    fetchRecentChats();
    fetchRecentVaultItems();
  }, [user, preloadedChats]);

  const handleChatPress = (chatId) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary px-6 pt-5">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9C01" />
        }
      >
        <Header
          subtitle="Welcome Back"
          title={user?.displayName}
          rightSlot={
            <View className="h-12 w-12 rounded-2xl bg-black-200 items-center justify-center">
              <Text className="text-white font-poppins_bold">PK</Text>
            </View>
          }
        />

        <View className="flex-row gap-3 mb-8">
          <AppButton
            title="New Chat"
            className="flex-1"
            icon={<MessageCircle size={20} color="#FFFFFF" />}
            onPress={() => router.push('/chats')}
          />
          <AppButton
            title="Hide Message"
            className="flex-1"
            variant="secondary"
            icon={<ImageIcon size={20} color="#FFFFFF" />}
            onPress={() => router.push('/vault')}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Users size={20} color="#FF9C01" />
              <Text className="text-white text-xl font-poppins_semibold">
                Recent Chats
              </Text>
            </View>
            <Text
              className="text-secondary font-poppins_medium"
              onPress={() => router.push('/chats')}
            >
              View all
            </Text>
          </View>

          {recentChats.length > 0 ? (
            recentChats.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => handleChatPress(item.id)}
                className="bg-black-100 rounded-2xl p-4 mb-3"
              >
                <Text className="text-white text-lg font-poppins_semibold">
                  {item.name}
                </Text>
                <Text className="text-gray text-sm mt-1 font-poppins">
                  {item.lastMessage}
                </Text>
                <Text className="text-white/40 text-xs mt-2">
                  {item.timestamp}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text className="text-white/50 text-center py-4 font-poppins">
              No recent chats
            </Text>
          )}

          <View className="mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Lock size={20} color="#FF9C01" />
                <Text className="text-white text-xl font-poppins_semibold">
                  Recent Vault Items
                </Text>
              </View>
              <Text
                className="text-secondary font-poppins_medium"
                onPress={() => router.push('/vault')}
              >
                View all
              </Text>
            </View>

            {recentVaultItems.length > 0 ? (
              recentVaultItems.map((item) => (
                <Pressable key={item.id} onPress={() => router.push('/vault')} className="bg-black-100 rounded-2xl p-4 mb-3">
                  <Text className="text-white text-lg font-poppins_semibold">
                    {item.title}
                  </Text>
                  <Text className="text-gray text-sm mt-1 font-poppins">
                    {item.fileType}
                  </Text>
                  <Text className="text-white/40 text-xs mt-2">
                    {item.createdAt}
                  </Text>
                </Pressable>
              ))
            ) : (
              <Text className="text-white/50 text-center py-4 font-poppins">
                No vault items yet
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

