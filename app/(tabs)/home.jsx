import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import Header from '../../components/Header';
import AppButton from '../../components/AppButton';
import { recentChats, userProfile } from '../../constants/dummy';
import { useGlobalContext } from '../../context/GlobalProvider';
export default function HomeScreen() {
    const { user } = useGlobalContext();
  return (
    <View className="flex-1 bg-primary px-6 pt-16">
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
          onPress={() => router.push('/chats')}
        />
        <AppButton
          title="Hide Message"
          className="flex-1"
          variant="secondary"
          onPress={() => router.push('/vault')}
        />
      </View>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-poppins_semibold">
            Recent Chats
          </Text>
          <Text
            className="text-secondary font-poppins_medium"
            onPress={() => router.push('/chats')}
          >
            View all
          </Text>
        </View>

        <FlatList
          data={recentChats}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-black-100 rounded-2xl p-4 mb-3">
              <Text className="text-white text-lg font-poppins_semibold">
                {item.name}
              </Text>
              <Text className="text-gray text-sm mt-1 font-poppins">
                {item.lastMessage}
              </Text>
              <Text className="text-white/40 text-xs mt-2">
                {item.timestamp}
              </Text>
            </View>
          )}
        />
      </View>
    </View>
  );
}

