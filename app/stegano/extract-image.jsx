import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Unlock } from 'lucide-react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { decodeMessage } from '../../lib/steganography';

export default function ExtractImageScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
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
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
        setDecoded(''); // Clear previous result
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleDecode = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image.');
      return;
    }

    try {
      setLoading(true);
      const result = await decodeMessage({
        carrier: selectedImage.uri,
        password: password.trim() || undefined,
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
    <SafeAreaView className="flex-1 bg-primary">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: 'Extract Message from Image',
        }}
      />
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-2 mb-2">
          <Unlock size={28} color="#FF9C01" />
          <Text className="text-3xl text-white font-poppins_bold">
            Extract Message from Image
          </Text>
        </View>
        <Text className="text-white/70 mb-6 font-poppins">
          Reveal hidden payloads from images directly on-device.
        </Text>

        <View className="gap-5">
          <View>
            <Text className="text-white font-poppins_medium mb-2">
              Select Image
            </Text>
            <AppButton
              title="Choose Image"
              variant="secondary"
              icon={<ImageIcon size={18} color="#FFFFFF" />}
              onPress={pickImage}
            />
            {selectedImage && (
              <View className="mt-3">
                <Image
                  source={{ uri: selectedImage.uri }}
                  className="w-full h-48 rounded-2xl"
                  resizeMode="cover"
                />
                <Text className="text-white/60 text-sm mt-2 font-poppins">
                  Image selected
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
            title={loading ? 'Decoding...' : 'Decode Message'}
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
    </SafeAreaView>
  );
}

