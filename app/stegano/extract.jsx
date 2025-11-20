import { useState } from 'react';
import { Stack } from 'expo-router';
import { ScrollView, Text, TextInput, View } from 'react-native';
import AppButton from '../../components/AppButton';
import { decodeMessage } from '../../lib/steganography';

export default function ExtractMessageScreen() {
  const [carrier, setCarrier] = useState('');
  const [decoded, setDecoded] = useState('');

  const handleDecode = async () => {
    try {
      const result = await decodeMessage({ carrier });
      setDecoded(result);
    } catch (error) {
      setDecoded(error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-primary px-6 pt-16">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#161622' },
          headerTintColor: '#FFFFFF',
          title: 'Extract Message'
        }}
      />
      <Text className="text-3xl text-white font-poppins_bold mb-2">
        Extract Message
      </Text>
      <Text className="text-white/70 mb-6 font-poppins">
        Reveal hidden payloads directly on-device.
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

        <AppButton title="Decode Message" onPress={handleDecode} />

        {decoded ? (
          <View className="bg-black-200 rounded-2xl p-4">
            <Text className="text-white/60 text-sm mb-2">
              Decoded Payload
            </Text>
            <Text className="text-white text-base font-poppins_medium">
              {decoded}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}


