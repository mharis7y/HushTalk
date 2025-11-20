import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, TextInput, View } from 'react-native';
import AppButton from '../../components/AppButton';
import { encodeMessage } from '../../lib/steganography';

export default function HideMessageScreen() {
  const [secret, setSecret] = useState('');
  const [carrier, setCarrier] = useState('');
  const [status, setStatus] = useState('');

  const handleEncode = async () => {
    try {
      setStatus('Encoding...');
      const result = await encodeMessage({ carrier, secret });
      setStatus(`Payload created with id ${result.id}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary px-6 pt-16">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: 'Hide Message'
        }}
      />
      <Text className="text-3xl text-white font-poppins_bold mb-2">
        Hide Message
      </Text>
      <Text className="text-white/70 mb-6 font-poppins">
        Embed covert text into images locally before syncing to Firebase Vault.
      </Text>

      <View className="gap-5">
        <View>
          <Text className="text-white font-poppins_medium mb-2">
            Carrier Image URL
          </Text>
          <TextInput
            placeholder="https://example.com/image.jpg"
            placeholderTextColor="#8D8DAA"
            value={carrier}
            onChangeText={setCarrier}
            className="bg-black-100 rounded-2xl px-4 py-3 text-white font-poppins"
          />
        </View>

        <View>
          <Text className="text-white font-poppins_medium mb-2">
            Secret Text
          </Text>
          <TextInput
            placeholder="Enter the text you want to hide"
            placeholderTextColor="#8D8DAA"
            value={secret}
            onChangeText={setSecret}
            multiline
            numberOfLines={5}
            className="bg-black-100 rounded-2xl px-4 py-3 text-white font-poppins min-h-[120px]"
          />
        </View>

        <AppButton title="Encode Message" onPress={handleEncode} />

        {status ? (
          <Text className="text-secondary font-poppins_medium">
            {status}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}


