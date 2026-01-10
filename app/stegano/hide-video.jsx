import { useState } from 'react';
import { Stack } from 'expo-router';
import { Text, View, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'lucide-react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { encodeMessage } from '../../lib/steganography';

export default function HideVideoScreen() {
  const [secret, setSecret] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video: ' + error.message);
    }
  };

  const handleEncode = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video.');
      return;
    }
    if (!secret.trim()) {
      Alert.alert('Error', 'Please enter the text you want to hide.');
      return;
    }

    try {
      setLoading(true);
      setStatus('Encoding...');
      const result = await encodeMessage({
        carrier: selectedVideo.uri,
        secret,
        password: password.trim() || undefined
      });
      setStatus('Message hidden successfully! Steganofied video saved.');
      Alert.alert(
        'Success',
        'Message hidden successfully! The steganofied video has been saved to your HushTalk folder.',
      );
      // Reset form
      setSelectedVideo(null);
      setSecret('');
      setPassword('');
    } catch (error) {
      setStatus(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: 'Hide Message in Video'
        }}
      />
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        className="flex-1 px-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center gap-2 mb-2 flex-wrap">
          <Video size={24} color="#FF9C01" />
          <Text className="text-2xl text-white font-poppins_bold flex-1">
            Hide Message in Video
          </Text>
        </View>
        <Text className="text-white/70 mb-6 font-poppins">
          Embed covert text into videos locally before syncing to Firebase Vault.
        </Text>

        <View className="gap-5">
          <View>
            <Text className="text-white font-poppins_medium mb-2">
              Select Video
            </Text>
            <AppButton
              title="Choose Video"
              variant="secondary"
              icon={<Video size={18} color="#FFFFFF" />}
              onPress={pickVideo}
            />
            {selectedVideo && (
              <View className="mt-3">
                <View className="w-full h-48 bg-black-200 rounded-2xl items-center justify-center">
                  <Video size={48} color="#FF9C01" />
                </View>
                <Text className="text-white/60 text-sm mt-2 font-poppins">
                  Video selected
                </Text>
              </View>
            )}
          </View>

          <AppInput
            label="Secret Text"
            placeholder="Enter the text you want to hide"
            value={secret}
            onChangeText={setSecret}
            multiline
            numberOfLines={5}
          />

          <AppButton
            title={loading ? 'Encoding...' : 'Encode Message'}
            onPress={handleEncode}
            disabled={loading}
          />

          {status ? (
            <Text className="text-secondary font-poppins_medium text-center">
              {status}
            </Text>
          ) : null}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

