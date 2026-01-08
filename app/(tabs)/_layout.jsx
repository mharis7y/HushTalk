import { Redirect, Tabs } from 'expo-router';
import { useGlobalContext } from '../../context/GlobalProvider';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabIcon = ({ name, color, label }) => (
  <View className="items-center justify-center gap-1">
    <Ionicons name={name} size={22} color={color} />
    <Text
      className={`text-[10px] font-poppins text-center w-full ${color === '#FF9C01' ? 'text-secondary' : 'text-white/60'
        }`}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {label}
    </Text>
  </View>
);

export default function TabsLayout() {
  const { loading, isLogged } = useGlobalContext();
  const { bottom } = useSafeAreaInsets();

  if (!loading && !isLogged) return <Redirect href="/login" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#161622',
          borderTopColor: '#232533',
          height: bottom + 60,

          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FF9C01',
        tabBarInactiveTintColor: '#CDCDE0',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <TabIcon name="home" color={color} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => (
            <TabIcon name="chatbubbles" color={color} label="Chats" />
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => (
            <TabIcon name="lock-closed" color={color} label="Vault" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <TabIcon name="person" color={color} label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}


