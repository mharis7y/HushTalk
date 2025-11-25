import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video, Lock } from 'lucide-react-native';
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
        allowsEditing: true,
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
      setStatus(`Payload created with id ${result.id}`);
      Alert.alert('Success', 'Message hidden successfully!');
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
    <ScrollView className="flex-1 bg-primary px-6 pt-16">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: 'Hide Message in Video'
        }}
      />
      <View className="flex-row items-center gap-2 mb-2">
        <Video size={28} color="#FF9C01" />
        <Text className="text-3xl text-white font-poppins_bold">
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

        <AppInput
          label="Password (Optional)"
          placeholder="Enter password to protect the hidden message"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <AppButton 
          title="Encode Message" 
          onPress={handleEncode}
          disabled={loading}
        />

        {status ? (
          <Text className="text-secondary font-poppins_medium text-center">
            {status}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

