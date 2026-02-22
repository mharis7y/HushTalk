import { View, Text } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';

export default function ChatBubble({ message, isOwn }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      const minutes = Math.floor(diff / 60000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  return (
    <View
      className={`max-w-[85%] rounded-3xl px-4 py-3 mb-3 ${isOwn ? 'self-end bg-secondary-100' : 'self-start bg-charcoal'
        }`}
    >
      <Text
        className={`text-base font-poppins ${isOwn ? 'text-black' : 'text-white'
          }`}
      >
        {message.text}
      </Text>
      <View className="flex-row items-center mt-1 self-end">
        <Text
          className={`text-xs font-poppins_medium mr-1 ${isOwn ? 'text-black/70' : 'text-white/60'
            }`}
        >
          {formatTime(message.createdAt)}
        </Text>
        {isOwn && (
          <View className="ml-1">
            {message.seen ? (
              <CheckCheck size={14} color="#000000" />
            ) : message.delivered ? (
              <Check size={14} color="#000000" />
            ) : (
              <Check size={14} color="#00000055" />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

