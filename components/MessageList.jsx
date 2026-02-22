import { FlatList, View, Text } from 'react-native';
import ChatBubble from './ChatBubble';

export default function MessageList({ messages, currentUserId }) {
  // Process messages to inject date separators
  const processedMessages = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMsg = messages[i];
    processedMessages.push({ ...currentMsg, itemType: 'message' });

    // Ensure we parse the date properly (ignoring time) for comparison
    const currentDateObj = new Date(currentMsg.createdAt);
    const currentDate = currentDateObj.toLocaleDateString([], {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    // nextMsg is actually the older message in the descending list
    const nextMsg = messages[i + 1];
    const nextDate = nextMsg ? new Date(nextMsg.createdAt).toLocaleDateString([], {
      year: 'numeric', month: 'short', day: 'numeric'
    }) : null;

    if (currentDate !== nextDate) {
      processedMessages.push({
        id: `date-${currentDate}`,
        itemType: 'date',
        date: currentDate,
      });
    }
  }

  return (
    <FlatList
      data={processedMessages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        if (item.itemType === 'date') {
          return (
            <View className="items-center my-4">
              <Text className="bg-black-100 px-3 py-1 rounded-full text-white/50 text-xs font-poppins_medium">
                {item.date}
              </Text>
            </View>
          );
        }
        return <ChatBubble message={item} isOwn={item.authorId === currentUserId} />;
      }}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      inverted
      className="flex-1"
    />
  );
}

