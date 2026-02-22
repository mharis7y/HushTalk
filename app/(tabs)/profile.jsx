import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, Text, View, Alert, Pressable, Modal } from 'react-native';
import { User, Lock, LogOut, ChevronRight, Star, Mail, Info, FileText, Shield, HelpCircle } from 'lucide-react-native';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { router } from 'expo-router';
import { signOut, auth, db } from '../../lib/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useGlobalContext } from '../../context/GlobalProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { user, setUser } = useGlobalContext();
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isUsernameModalVisible, setUsernameModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [infoModal, setInfoModal] = useState({ visible: false, title: '', content: '' });

  // Form states
  const [username, setUsername] = useState(user?.username || user?.displayName || '');
  const [passwords, setPasswords] = useState({
    current: '',
    newPass: '',
  });

  const handleUpdateUsername = async () => {
    if (!username.trim() || !user) return;
    if (username === (user.username || user.displayName)) {
      setUsernameModalVisible(false);
      return;
    }

    try {
      setLoading(true);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: username.trim(),
        });
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        username: username.trim(),
      });

      setUser({ ...user, username: username.trim(), displayName: username.trim() });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Username updated successfully!',
        position: 'bottom'
      });
      setUsernameModalVisible(false);
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

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwords.current
      );
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, passwords.newPass);

      setPasswords({ current: '', newPass: '' });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password updated successfully!',
        position: 'bottom'
      });
      setPasswordModalVisible(false);
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
        { text: "Cancel", style: "cancel" },
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

  const isPremium = user?.isPremium === 1;

  return (
    <SafeAreaView className="flex-1 bg-primary px-6 pt-5">
      <ScrollView showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag">
        {/* Profile Header */}
        <View className="flex-row items-center border border-white/10 p-5 rounded-3xl bg-black-100 mb-6">
          <View className="relative">
            <View className="w-20 h-20 bg-secondary-100 rounded-full items-center justify-center">
              <Text className="text-black text-3xl font-poppins_bold">
                {user?.username?.[0]?.toUpperCase() || user?.displayName?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View className="ml-5 flex-1">
            <Text className="text-white text-xl font-poppins_bold">
              {user?.username || user?.displayName || 'User'}
            </Text>
            <Text className="text-white/60 text-sm font-poppins mb-3">
              {user?.email || ''}
            </Text>
            <View className="self-start px-3 py-1 rounded-full border border-secondary bg-secondary/10 flex-row items-center">
              {isPremium && <Star size={12} color="#FF9C01" className="mr-1" />}
              <Text className="text-secondary text-xs font-poppins_bold">
                {isPremium ? 'Premium' : 'Basic'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu List */}
        <View className="bg-black-100 border border-white/10 rounded-3xl p-5 mb-8">
          <Text className="text-white text-lg font-poppins_semibold mb-4">Account</Text>

          <Pressable
            onPress={() => setUsernameModalVisible(true)}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <User size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">Change Username</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>

          <Pressable
            onPress={() => setPasswordModalVisible(true)}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <Lock size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">Change Password</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>

          {!isPremium && (
            <Pressable
              onPress={() => router.push('/subscribe')}
              className="flex-row items-center justify-between border border-secondary/30 bg-secondary/10 rounded-2xl p-4 mb-3 active:bg-secondary/20"
            >
              <View className="flex-row items-center gap-3">
                <Star size={20} color="#FF9C01" strokeWidth={1.5} />
                <Text className="text-secondary text-base font-poppins_medium">Become Premium</Text>
              </View>
              <ChevronRight size={20} color="#FF9C01" opacity={0.5} />
            </Pressable>
          )}
        </View>

        <View className="bg-black-100 border border-white/10 rounded-3xl p-5 mb-8">
          <Text className="text-white text-lg font-poppins_semibold mb-4">App Information</Text>

          <Pressable
            onPress={() => setInfoModal({
              visible: true,
              title: 'Privacy Policy',
              content: 'Your privacy is paramount. HushTalk encrypts conversations securely. We do not store deciphered keys on our servers. Steganography is performed locally on your device ensuring full privacy.'
            })}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <Shield size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">Privacy Policy</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>

          <Pressable
            onPress={() => setInfoModal({
              visible: true,
              title: 'Terms of Service',
              content: 'By using HushTalk, you agree to not use the app for illegal activities. We reserve the right to ban users participating in malicious operations. The complete Terms and Conditions are bound by Local Law.'
            })}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <FileText size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">Terms of Service</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>

          <Pressable
            onPress={() => setInfoModal({
              visible: true,
              title: 'Contact Support',
              content: 'For support or inquiries, please email us directly at: \n\nsupport@hushtalk.com\n\nOur team aims to respond within 24-48 business hours.'
            })}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <HelpCircle size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">Contact Support</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>

          <Pressable
            onPress={() => setInfoModal({
              visible: true,
              title: 'About HushTalk',
              content: 'HushTalk Version 1.0.0\n\nA stealth communication tool designed to keep your media secure explicitly using localized steganography algorithms. Developed by Mharis7y.'
            })}
            className="flex-row items-center justify-between border border-white/10 rounded-2xl p-4 mb-3 active:bg-white/5"
          >
            <View className="flex-row items-center gap-3">
              <Info size={20} color="#FFFFFF" strokeWidth={1.5} />
              <Text className="text-white text-base font-poppins_medium">About HushTalk</Text>
            </View>
            <ChevronRight size={20} color="#FFFFFF" opacity={0.5} />
          </Pressable>
        </View>

        <View className="mb-10 mx-6">

          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center bg-[#E53935] rounded-2xl p-4 mt-2 active:opacity-80 gap-2"
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-poppins_bold">Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Username Modal */}
      <Modal visible={isUsernameModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" className="flex-1 bg-black/80 items-center justify-end">
          <View className="w-full bg-primary rounded-t-3xl p-6 min-h-[50%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl text-white font-poppins_bold">Edit Identity</Text>
              <Pressable onPress={() => setUsernameModalVisible(false)}>
                <Text className="text-white/60 font-poppins_bold text-lg">Cancel</Text>
              </Pressable>
            </View>
            <AppInput
              label="Username"
              value={username}
              onChangeText={setUsername}
            />
            <View className="mt-6">
              <AppButton
                title="Save Changes"
                onPress={handleUpdateUsername}
                disabled={loading || !username.trim() || username === (user?.username || user?.displayName)}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Password Modal */}
      <Modal visible={isPasswordModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior="padding" className="flex-1 bg-black/80 items-center justify-end">
          <View className="w-full bg-primary rounded-t-3xl p-6 min-h-[60%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl text-white font-poppins_bold">Security</Text>
              <Pressable onPress={() => setPasswordModalVisible(false)}>
                <Text className="text-white/60 font-poppins_bold text-lg">Cancel</Text>
              </Pressable>
            </View>
            <AppInput
              label="Current Password"
              placeholder="••••••••"
              secureTextEntry
              value={passwords.current}
              onChangeText={(value) => setPasswords((prev) => ({ ...prev, current: value }))}
            />
            <View className="mt-4">
              <AppInput
                label="New Password"
                placeholder="••••••••"
                secureTextEntry
                value={passwords.newPass}
                onChangeText={(value) => setPasswords((prev) => ({ ...prev, newPass: value }))}
              />
            </View>
            <View className="mt-6">
              <AppButton
                title="Update Password"
                onPress={handleUpdatePassword}
                disabled={loading || !passwords.current || !passwords.newPass || passwords.newPass.length < 6}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Info Modal */}
      <Modal visible={infoModal.visible} animationType="fade" transparent>
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full bg-black-100 rounded-3xl p-6">
            <Text className="text-2xl text-white font-poppins_bold mb-4">
              {infoModal.title}
            </Text>
            <Text className="text-white/80 font-poppins text-base mb-8 leading-6">
              {infoModal.content}
            </Text>
            <AppButton
              title="Close"
              variant="secondary"
              onPress={() => setInfoModal({ visible: false, title: '', content: '' })}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
