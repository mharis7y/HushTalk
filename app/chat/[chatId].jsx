import { useMemo, useState } from 'react';
import { SafeAreaView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import MessageList from '../../components/MessageList';
import { chatMessages, recentChats, userProfile } from '../../constants/dummy';
import CustomButton from '../../components/CustomButton';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams();
  const [composer, setComposer] = useState('');
  const [messages, setMessages] = useState(chatMessages);

  const chat = useMemo(
    () => recentChats.find((item) => item.id === chatId) ?? recentChats[0],
    [chatId],
  );

  const handleSend = () => {
    if (!composer.trim()) return;
    const newMessage = {
      id: `msg-${Date.now()}`,
      text: composer.trim(),
      createdAt: 'Now',
      authorId: userProfile.id,
    };
    setMessages((prev) => [newMessage, ...prev]);
    setComposer('');
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: chat?.name ?? 'Chat',
        }}
      />
      <View className="flex-1 px-4">
        <MessageList messages={messages} currentUserId={userProfile.id} />
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
            containerStyles="px-2 min-h-[40px] text-[2px] "
            handlePress={handleSend}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}


