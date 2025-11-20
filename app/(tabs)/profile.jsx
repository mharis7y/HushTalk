import { useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { userProfile } from '../../constants/dummy';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const [username, setUsername] = useState(userProfile.username);
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
  });

  return (
    <ScrollView className="flex-1 bg-primary px-6 pt-16">
      <View className="items-center mb-8">
        <Image
          source={{ uri: userProfile.avatar }}
          className="h-24 w-24 rounded-3xl mb-4"
        />
        <Text className="text-white text-3xl font-poppins_bold">
          {userProfile.username}
        </Text>
        <Text className="text-white/60 font-poppins">
          {userProfile.email}
        </Text>
      </View>

      <View className="gap-5">
        <Text className="text-white text-xl font-poppins_semibold">
          Identity
        </Text>
        <AppInput
          label="Username"
          value={username}
          onChangeText={setUsername}
        />
        <AppButton title="Save Changes" />
      </View>

      <View className="gap-5 mt-10">
        <Text className="text-white text-xl font-poppins_semibold">
          Security
        </Text>
        <AppInput
          label="Current Password"
          placeholder="••••••••"
          secureTextEntry
          value={passwords.current}
          onChangeText={(value) =>
            setPasswords((prev) => ({ ...prev, current: value }))
          }
        />
        <AppInput
          label="New Password"
          placeholder="••••••••"
          secureTextEntry
          value={passwords.newPass}
          onChangeText={(value) =>
            setPasswords((prev) => ({ ...prev, newPass: value }))
          }
        />
        <AppButton title="Update Password" variant="secondary" />
      </View>

      <View className="mt-12 mb-10">
        <AppButton
          title="Log Out"
          variant="ghost"
          onPress={() => router.replace('/login')}
        />
      </View>
    </ScrollView>
  );
}

