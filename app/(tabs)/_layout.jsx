import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

const TabIcon = ({ name, color, label }) => (
  <View className="items-center justify-center gap-1">
    <Ionicons name={name} size={22} color={color} />
    <Text
      className={`text-xs font-poppins_medium ${
        color === '#FF9C01' ? 'text-secondary' : 'text-white/60'
      }`}
    >
      {label}
    </Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#1E1E2D',
          borderTopColor: '#232533',
          height: 70,
          paddingTop: 1,
        
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


