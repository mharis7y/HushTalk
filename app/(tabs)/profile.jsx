import { useState } from 'react';
import { KeyboardAvoidingView,Image, ScrollView, Text, View, Alert } from 'react-native';
import { User, Lock, LogOut } from 'lucide-react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { router } from 'expo-router';
import { signOut, auth, db } from '../../lib/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, setUser } = useGlobalContext();
  const [username, setUsername] = useState(user?.displayName || '');
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateUsername = async () => {
    if (!username.trim() || !user) return;
    if (username === user.displayName) {
      Alert.alert('Info', 'Username is the same as current.');
      return;
    }

    try {
      setLoading(true);
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: username.trim(),
      });

      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: username.trim(),
      });

      // Update local user state
      setUser({ ...user, displayName: username.trim() });
      
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.newPass || !user) return;
    if (passwords.newPass.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('User not authenticated');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwords.current
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, passwords.newPass);

      // Clear password fields
      setPasswords({ current: '', newPass: '' });
      
      Alert.alert('Success', 'Password updated successfully!');
    } catch (error) {
      let errorMessage = 'Failed to update password.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    <SafeAreaView className="flex-1 bg-primary px-6 pt-5">
    <KeyboardAvoidingView behavior="padding" >
    <ScrollView keyboardDismissMode="on-drag">
      <View className="items-center mb-8">
        <View className="h-24 w-24 rounded-3xl mb-4 bg-secondary-100 items-center justify-center">
          <Text className="text-black text-4xl font-poppins_bold">
            {user?.displayName?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="text-white text-3xl font-poppins_bold">
          {user?.displayName || 'User'}
        </Text>
        <Text className="text-white/60 font-poppins">
          {user?.email || ''}
        </Text>
      </View>

      <View className="gap-5">
        <View className="flex-row items-center gap-2">
          <User size={20} color="#FF9C01" />
          <Text className="text-white text-xl font-poppins_semibold">
            Identity
          </Text>
        </View>
        <AppInput
          label="Username"
          value={username}
          onChangeText={setUsername}
        />
        <AppButton 
          title="Save Changes" 
          onPress={handleUpdateUsername}
          disabled={loading || !username.trim() || username === user?.displayName}
        />
      </View>

      <View className="gap-5 mt-10">
        <View className="flex-row items-center gap-2">
          <Lock size={20} color="#FF9C01" />
          <Text className="text-white text-xl font-poppins_semibold">
            Security
          </Text>
        </View>
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
        <AppButton 
          title="Update Password" 
          variant="secondary"
          onPress={handleUpdatePassword}
          disabled={loading || !passwords.current || !passwords.newPass || passwords.newPass.length < 6}
        />
      </View>

      <View className="mt-12 mb-5 ">
        <AppButton
          title="Log Out"
          variant="ghost"
          icon={<LogOut size={18} color="#FF9C01" />}
          onPress={handleSignOut}
        />
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

