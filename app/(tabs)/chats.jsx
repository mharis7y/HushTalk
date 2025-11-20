import { useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { recentChats } from '../../constants/dummy';

export default function ChatsScreen() {
  const [query, setQuery] = useState('');

  const filtered = recentChats.filter((chat) =>
    chat.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View className="flex-1 bg-primary px-6 pt-16">
      <Text className="text-3xl text-white font-poppins_bold mb-2">
        Chats
      </Text>
      <Text className="text-white/60 mb-6 font-poppins">
        Connect locally, stay resilient globally.
      </Text>

      <TextInput
        placeholder="Search allies..."
        placeholderTextColor="#8D8DAA"
        value={query}
        onChangeText={setQuery}
        className="bg-black-100 rounded-2xl px-4 py-3 text-white font-poppins mb-6"
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.id}`)}
            className="bg-black-200 rounded-3xl p-4 mb-4 border border-transparent active:border-secondary-100"
          >
            <Text className="text-lg text-white font-poppins_semibold">
              {item.name}
            </Text>
            <Text className="text-white/70 mt-1">{item.lastMessage}</Text>
            <Text className="text-white/40 text-xs mt-2">
              {item.timestamp}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="text-center text-white/60 mt-20">
            No chats found. Start a conversation!
          </Text>
        }
      />
    </View>
  );
}


