import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, View, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Lock } from 'lucide-react-native';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import { encodeMessage } from '../../lib/steganography';

export default function HideImageScreen() {
  const [secret, setSecret] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleEncode = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image.');
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
        carrier: selectedImage.uri, 
        secret,
        password: password.trim() || undefined 
      });
      setStatus(`Payload created with id ${result.id}`);
      Alert.alert('Success', 'Message hidden successfully!');
      // Reset form
      setSelectedImage(null);
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
          title: 'Hide Message in Image'
        }}
      />
      <View className="flex-row items-center gap-2 mb-2">
        <ImageIcon size={28} color="#FF9C01" />
        <Text className="text-3xl text-white font-poppins_bold">
          Hide Message in Image
        </Text>
      </View>
      <Text className="text-white/70 mb-6 font-poppins">
        Embed covert text into images locally before syncing to Firebase Vault.
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

