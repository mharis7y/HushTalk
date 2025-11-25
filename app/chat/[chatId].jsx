import { useEffect, useState } from 'react';
import { SafeAreaView, Text, TextInput, View, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import MessageList from '../../components/MessageList';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomButton from '../../components/CustomButton';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useGlobalContext();
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Fetch other user's info
    const fetchOtherUser = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find((id) => id !== user.uid);
          if (otherUserId) {
            // Find user by userId field
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('userId', '==', otherUserId));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              setOtherUser({ id: userDoc.id, ...userDoc.data() });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };

    // Listen to messages in realtime
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = [];
      snapshot.forEach((doc) => {
        messagesList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesList);
      setLoading(false);
    });

    // Mark messages as read when viewing chat
    const markAsRead = async () => {
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const unreadCounts = chatData.unreadCounts || {};
          unreadCounts[user.uid] = 0;
          await updateDoc(chatRef, {
            unreadCounts,
          });
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    };

    fetchOtherUser();
    markAsRead();

    return () => unsubscribe();
  }, [chatId, user]);

  const handleSend = async () => {
    if (!composer.trim() || !user || !chatId) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: composer.trim(),
        authorId: user.uid,
        createdAt: new Date().toISOString(),
      });

      // Update chat's last message and increment unread for other user
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find((id) => id !== user.uid);
        const unreadCounts = chatData.unreadCounts || {};
        unreadCounts[otherUserId] = (unreadCounts[otherUserId] || 0) + 1;
        
        await updateDoc(chatRef, {
          lastMessage: composer.trim(),
          lastMessageTime: new Date().toISOString(),
          unreadCounts,
        });
      }

      setComposer('');
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
      <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={0} className="flex-1 px-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#FF9C01" />
          </View>
        ) : (
          <MessageList messages={messages} currentUserId={user?.uid} />
        )}
        <View className="flex-row items-center gap-2 mb-6">
          <TextInput
            placeholder="Send a message..."
            placeholderTextColor="#8D8DAA"
            value={composer}
            onChangeText={setComposer}
            multiline
            className="flex-1 min-h-[48px] max-h-[120px] bg-black-100 rounded-2xl px-6 py-3 text-white font-poppins"
          />
          <CustomButton
            title="Send"
            containerStyles="px-4 min-h-[40px]"
            handlePress={handleSend}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


