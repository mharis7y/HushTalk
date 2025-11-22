import { useState } from 'react';
import { KeyboardAvoidingView,Image, ScrollView, Text, View, Alert } from 'react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { userProfile } from '../../constants/dummy';
import { router } from 'expo-router';
import { signOut } from '../../lib/firebase';
import { useGlobalContext } from '../../context/GlobalProvider';

export default function ProfileScreen() {
  const { user } = useGlobalContext();
  const [username, setUsername] = useState(user.displayName);
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
  });

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              router.replace("/login");
            } else {
              Alert.alert("Error", result.msg || "Failed to sign out");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-primary px-6 pt-10">
    <ScrollView keyboardDismissMode="on-drag">
      <View className="items-center mb-8">
        <Image
          source={{ uri: userProfile.avatar }}
          className="h-24 w-24 rounded-3xl mb-4"
        />
        <Text className="text-white text-3xl font-poppins_bold">
          {user.displayName}
        </Text>
        <Text className="text-white/60 font-poppins">
          {user.email}
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

      <View className="mt-12 mb-10 ">
        <AppButton
          title="Log Out"
          variant="ghost"
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

