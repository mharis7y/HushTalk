import { View, Text } from 'react-native';

export default function ChatBubble({ message, isOwn }) {
  return (
    <View
      className={`max-w-[85%] rounded-3xl px-4 py-3 mb-3 ${
        isOwn ? 'self-end bg-secondary-100' : 'self-start bg-charcoal'
      }`}
    >
      <Text
        className={`text-base font-poppins ${
          isOwn ? 'text-black' : 'text-white'
        }`}
      >
        {message.text}
      </Text>
      <Text
        className={`text-xs mt-1 font-poppins_medium ${
          isOwn ? 'text-black/70' : 'text-white/60'
        }`}
      >
        {message.createdAt}
      </Text>
    </View>
  );
}


