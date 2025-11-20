import { FlatList } from 'react-native';
import ChatBubble from './ChatBubble';

export default function MessageList({ messages, currentUserId }) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatBubble message={item} isOwn={item.authorId === currentUserId} />
      )}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      inverted
      className="flex-1"
    />
  );
}


