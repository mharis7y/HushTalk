import { useEffect, useState } from 'react';
import { TextInput, View, ActivityIndicator, KeyboardAvoidingView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import MessageList from '../../components/MessageList';
import { getApp } from '@react-native-firebase/app';
import { encryptMessage, decryptMessage } from '../../lib/crypto';
import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
} from '@react-native-firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useGlobalContext();
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const db = getFirestore(getApp());

    // Fetch other user's info
    const fetchOtherUser = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants?.find((id) => id !== user.uid);
          if (otherUserId) {
            const usersSnapshot = await getDocs(
              query(collection(db, 'users'), where('userId', '==', otherUserId))
            );
            if (!usersSnapshot.empty) {
              const userDoc = usersSnapshot.docs[0];
              setOtherUser({ id: userDoc.id, ...userDoc.data() });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };

    /**
     * Offline caching: @react-native-firebase/firestore has offline persistence
     * enabled by default on Android (SQLite). The onSnapshot listener serves
     * cached data immediately on reopen, then syncs new messages from the server.
     */
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      const messagesList = [];
      const batch = writeBatch(db);
      let batchCount = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Decrypt message text on the client side if the isEncrypted flag is set.
        // Legacy messages without the flag are displayed as-is (plain text).
        const displayText =
          data.isEncrypted === 1 ? decryptMessage(data.text) : data.text;

        messagesList.push({ id: docSnap.id, ...data, text: displayText });

        // Mark messages as seen if not authored by me and not already seen
        if (data.authorId !== user.uid && !data.seen) {
          batch.update(docSnap.ref, {
            seen: true,
            seenAt: new Date().toISOString(),
          });
          batchCount++;
        }
      });

      setMessages(messagesList);
      setLoading(false);

      if (batchCount > 0) {
        try {
          await batch.commit();
        } catch (error) {
          console.error('Error committing batch for seen status:', error);
        }
      }
    });

    // Reset unread count to 0 when entering chat
    const markAsRead = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const unreadCounts = chatData.unreadCounts || {};
          unreadCounts[user.uid] = 0;
          await updateDoc(chatRef, { unreadCounts });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    };

    fetchOtherUser();
    markAsRead();

    return () => unsubscribe();
  }, [chatId, user?.uid]);

  const handleSend = async () => {
    if (!composer.trim() || !user?.uid || !chatId) return;

    const messageText = composer.trim();

    // Optimistic UI: clear the input IMMEDIATELY before the async call
    setComposer('');

    // Encrypt the message before it leaves the device
    const encryptedText = encryptMessage(messageText);

    const db = getFirestore(getApp());

    try {
      // Store the encrypted text + isEncrypted flag so the server never sees plain text
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: encryptedText,
        isEncrypted: 1,
        authorId: user.uid,
        createdAt: new Date().toISOString(),
        delivered: true,
        seen: false,
        seenAt: '',
      });

      // Update chat's lastMessage (also encrypted) and increment unread for the other participant
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants?.find((id) => id !== user.uid);
        const unreadCounts = chatData.unreadCounts || {};
        if (otherUserId) {
          unreadCounts[otherUserId] = (unreadCounts[otherUserId] || 0) + 1;
        }

        await updateDoc(chatRef, {
          lastMessage: encryptedText,
          lastMessageTime: new Date().toISOString(),
          isEncrypted: 1,
          unreadCounts,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: otherUser?.username || 'Chat',
        }}
      />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={100} className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF9C01" />
          </View>
        ) : (
          <MessageList messages={messages} currentUserId={user?.uid} />
        )}
        <View className="flex-row items-center gap-2">
          <TextInput
            placeholder="Send a message..."
            placeholderTextColor="#8D8DAA"
            value={composer}
            onChangeText={setComposer}
            multiline
            className="flex-1 min-h-[48px] max-h-[120px] bg-black-100 rounded-2xl px-6 py-3 text-white font-poppins"
          />
          <Pressable onPress={handleSend} className="p-2">
            <Send color={'#FF9C01'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
