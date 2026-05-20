import { useEffect, useState, useCallback } from 'react';
import { Text, View, Pressable, ScrollView, RefreshControl, Image, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MessageCircle, Image as ImageIcon, Users, Lock, Download, Trash2 } from 'lucide-react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from '@react-native-firebase/firestore';
import Header from '../../components/Header';
import AppButton from '../../components/AppButton';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decryptMessage } from '../../lib/crypto';
import { databases, storage, APPWRITE_CONFIG } from '../../lib/appwriteConfig';
import { Query } from 'react-native-appwrite';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export default function HomeScreen() {
  const { user, preloadedChats } = useGlobalContext();
  const [recentChats, setRecentChats] = useState([]);
  const [recentVaultItems, setRecentVaultItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchRecentChats(), fetchRecentVaultItems()]);
    setRefreshing(false);
  }, [user, preloadedChats]);

  // Fetch top 3 most recent chats, sorted by lastMessageTime descending
  const fetchRecentChats = async () => {
    if (!user?.uid || !preloadedChats || preloadedChats.length === 0) return;
    try {
      const db = getFirestore(getApp());

      const sorted = [...preloadedChats].sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessageTime || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      const chatsWithUsers = await Promise.all(
        sorted.slice(0, 3).map(async (chat) => {
          const otherUserId = chat.participants?.find((id) => id !== user.uid);
          if (!otherUserId) return null;

          const usersSnapshot = await getDocs(
            query(collection(db, 'users'), where('userId', '==', otherUserId))
          );
          if (!usersSnapshot.empty) {
            const userData = usersSnapshot.docs[0].data();
            // Decrypt the lastMessage preview if it was encrypted on send
            const rawLastMessage = chat.lastMessage || '';
            const displayLastMessage = rawLastMessage
              ? chat.isEncrypted === 1
                ? decryptMessage(rawLastMessage)
                : rawLastMessage
              : 'Start a conversation';

            return {
              id: chat.id,
              name: userData.username || 'Unknown User',
              phoneNumber: userData.phoneNumber || '',
              lastMessage: displayLastMessage,
              unreadCount: (chat.unreadCounts || {})[user.uid] || 0,
              timestamp: chat.lastMessageTime
                ? new Date(chat.lastMessageTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Just now',
              avatarLetter: userData.username?.[0]?.toUpperCase() || 'U',
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

  // Fetch latest 3 vault items
  const fetchRecentVaultItems = async () => {
    if (!user?.uid) return;
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionId,
        [
          Query.equal('ownerId', user.uid),
          Query.orderDesc('$createdAt'),
          Query.limit(3),
        ]
      );

      const items = response.documents.map((doc) => ({
        id: doc.$id,
        fileId: doc.fileId,
        title: doc.fileName,
        fileType: doc.type,
        createdAt: new Date(doc.$createdAt).toLocaleDateString(),
        downloadUrl: `https://sgp.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${doc.fileId}/download?project=${APPWRITE_CONFIG.projectId}`,
      }));
      setRecentVaultItems(items);
    } catch (error) {
      console.error('Error fetching vault items:', error);
    }
  };

  // Download handler — mirrors vault.jsx
  const handleDownload = async (item) => {
    try {
      if (!permissionResponse || permissionResponse.status !== 'granted') {
        const { status } = await requestPermission();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'We need access to your gallery to save the file.');
          return;
        }
      }

      let fileName = item.title;
      if (!fileName.toLowerCase().endsWith('.png')) {
        fileName = fileName.replace(/\.[^.]+$/, '') + '.png';
      }

      const localUri = `${FileSystem.documentDirectory}${fileName}`;
      const downloadResult = await FileSystem.downloadAsync(item.downloadUrl, localUri);

      if (downloadResult.status !== 200) throw new Error('Download failed from server');

      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      const album = await MediaLibrary.getAlbumAsync('HushTalk');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('HushTalk', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      Toast.show({
        type: 'success',
        text1: 'Saved to Gallery',
        text2: 'File saved to HushTalk album.',
        position: 'bottom',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Download Failed',
        text2: error.message || 'Could not save file',
        position: 'bottom',
      });
    }
  };

  // Delete handler — mirrors vault.jsx
  const handleDelete = (item) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteFile(APPWRITE_CONFIG.bucketId, item.fileId);
              await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collectionId,
                item.id
              );
              setRecentVaultItems((prev) => prev.filter((i) => i.id !== item.id));
              Toast.show({ type: 'success', text1: 'Deleted', text2: 'Item removed successfully' });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentVaultItems();
    }, [user?.uid])
  );

  useEffect(() => {
    if (!user?.uid) return;
    fetchRecentChats();
    fetchRecentVaultItems();
  }, [user?.uid, preloadedChats]);

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
          title={user?.username || user?.displayName}
          rightSlot={
            <View className="h-12 w-12 rounded-2xl bg-black-200 items-center justify-center">
              <Text className="text-white font-poppins_bold">
                {user?.username?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'U'}
              </Text>
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

        {/* ─── Recent Chats ─────────────────────────────────────────── */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center gap-2">
            <Users size={20} color="#FF9C01" />
            <Text className="text-white text-xl font-poppins_semibold">Recent Chats</Text>
          </View>
          <Text className="text-secondary font-poppins_medium" onPress={() => router.push('/chats')}>
            View all
          </Text>
        </View>

        {recentChats.length > 0 ? (
          recentChats.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/chat/${item.id}`)}
              className="bg-black-200 rounded-3xl p-4 mb-4 border border-transparent active:border-secondary-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-secondary-100 rounded-full items-center justify-center">
                  <Text className="text-white text-lg font-poppins_bold">{item.avatarLetter}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg text-white font-poppins_semibold">{item.name}</Text>
                    <Text className="text-white/40 text-xs font-poppins">{item.timestamp}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-white/60 text-sm font-poppins flex-1 mr-2" numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View className="w-6 h-6 bg-secondary-100 rounded-full items-center justify-center">
                        <Text className="text-black text-xs font-poppins_bold">
                          {item.unreadCount > 9 ? '9+' : item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <Text className="text-white/50 text-center py-4 font-poppins">No recent chats</Text>
        )}

        {/* ─── Recent Vault Items ───────────────────────────────────── */}
        <View className="mt-8 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Lock size={20} color="#FF9C01" />
              <Text className="text-white text-xl font-poppins_semibold">Recent Vault Items</Text>
            </View>
            <Text className="text-secondary font-poppins_medium" onPress={() => router.push('/vault')}>
              View all
            </Text>
          </View>

          {recentVaultItems.length > 0 ? (
            recentVaultItems.map((item) => (
              /* Exact same card layout as vault.jsx renderItem */
              <View key={item.id} className="bg-[#1E1E28] rounded-2xl p-4 mb-4 flex-row items-center">
                {/* Icon thumbnail */}
                <View className="w-16 h-16 bg-black-200 rounded-xl mr-4 overflow-hidden items-center justify-center">
                  <Image
                    source={require('../../assets/images/splash-icon.png')}
                    className="w-10 h-10"
                    resizeMode="contain"
                    style={{ tintColor: '#FF9C01' }}
                  />
                </View>

                {/* Text + Buttons */}
                <View className="flex-1">
                  <Text className="text-white text-lg font-poppins_semibold" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-white/60 mt-0.5 font-poppins">{item.createdAt}</Text>
                  <Text className="text-white/40 text-sm mt-1 font-poppins_light capitalize">
                    {item.fileType}
                  </Text>

                  <View className="flex-row mt-3 items-center">
                    <Pressable
                      className="flex-row items-center mr-6"
                      onPress={() => handleDownload(item)}
                    >
                      <Download size={16} color="#FF9C01" />
                      <Text className="text-[#FF9C01] ml-2 font-poppins_medium">Download</Text>
                    </Pressable>

                    <Pressable
                      className="flex-row items-center"
                      onPress={() => handleDelete(item)}
                    >
                      <Trash2 size={16} color="#FF4C4C" />
                      <Text className="text-[#FF4C4C] ml-2 font-poppins_medium">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-white/50 text-center py-4 font-poppins">No vault items yet</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
