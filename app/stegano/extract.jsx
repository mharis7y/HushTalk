import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, Image, Alert, Pressable, KeyboardAvoidingView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Lock, Upload, Unlock } from 'lucide-react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { decodeMessage } from '../../lib/steganography';

export default function ExtractMessageScreen() {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [password, setPassword] = useState('');
  const [decoded, setDecoded] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your media library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0]);
        setDecoded(''); // Clear previous result
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

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
        setSelectedMedia(result.assets[0]);
        setDecoded(''); // Clear previous result
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video: ' + error.message);
    }
  };

  const handleDecode = async () => {
    if (!selectedMedia) {
      Alert.alert('Error', 'Please select an image or video.');
      return;
    }

    try {
      setLoading(true);
      const result = await decodeMessage({
        carrier: selectedMedia.uri,
        password: password.trim() || undefined
      });
      setDecoded(result);
    } catch (error) {
      setDecoded('');
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-primary">
      <ScrollView className="flex-1 px-6 pt-16">
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#161622' },
            headerTintColor: '#FFFFFF',
            title: 'Extract Message'
          }}
        />
        <View className="flex-row items-center gap-2 mb-2">
          <Unlock size={28} color="#FF9C01" />
          <Text className="text-3xl text-white font-poppins_bold">
            Extract Message
          </Text>
        </View>
        <Text className="text-white/70 mb-6 font-poppins">
          Reveal hidden payloads directly on-device.
        </Text>

        <View className="gap-5">
          <View>
            <Text className="text-white font-poppins_medium mb-2">
              Select Media
            </Text>
            <View className="flex-row gap-3">
              <AppButton
                title="Choose Image"
                variant="secondary"
                className="flex-1"
                icon={<ImageIcon size={18} color="#FFFFFF" />}
                onPress={pickImage}
              />
              <AppButton
                title="Choose Video"
                variant="secondary"
                className="flex-1"
                icon={<Upload size={18} color="#FFFFFF" />}
                onPress={pickVideo}
              />
            </View>
            {selectedMedia && (
              <View className="mt-3">
                <Image
                  source={{ uri: selectedMedia.uri }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
                <Text className="text-white/60 text-sm mt-2 font-poppins">
                  {selectedMedia.type === 'video' ? 'Video' : 'Image'} selected
                </Text>
              </View>
            )}
          </View>

          <AppInput
            label="Password (Optional)"
            placeholder="Enter password if the message was protected"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <AppButton
            title="Decode Message"
            onPress={handleDecode}
            disabled={loading}
          />

          {decoded ? (
            <View className="bg-black-200 rounded-2xl p-4">
              <Text className="text-white/60 text-sm mb-2 font-poppins_medium">
                Decoded Payload
              </Text>
              <Text className="text-white text-base font-poppins">
                {decoded}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


