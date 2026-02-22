import { useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Upload, CheckCircle2 } from 'lucide-react-native';
import AppButton from '../components/AppButton';
import { useGlobalContext } from '../context/GlobalProvider';
import { storage, APPWRITE_CONFIG, ID } from '../lib/appwriteConfig';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

export default function SubscribeScreen() {
    const { user } = useGlobalContext();
    const [screenshot, setScreenshot] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setScreenshot(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!screenshot || !user) {
            Toast.show({
                type: 'error',
                text1: 'Missing file',
                text2: 'Please upload a transaction screenshot.',
            });
            return;
        }

        try {
            setUploading(true);

            // 1. Upload to Appwrite Storage (userMedia bucket)
            const asset = {
                name: screenshot.fileName || `screenshot_${Date.now()}.png`,
                type: screenshot.mimeType || 'image/png',
                size: screenshot.fileSize,
                uri: screenshot.uri,
            };

            const uploadedFile = await storage.createFile(
                APPWRITE_CONFIG.bucketId,
                ID.unique(),
                asset
            );

            const fileUrl = `https://sgp.cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${uploadedFile.$id}/view?project=${APPWRITE_CONFIG.projectId}`;

            // 2. Store Request in Firestore
            await addDoc(collection(db, 'subscriptionRequests'), {
                userId: user.uid,
                username: user.username || user.displayName || 'Unknown',
                screenshotUrl: fileUrl,
                fileId: uploadedFile.$id, // storing for potential deletion if rejected
                status: 'pending',
                createdAt: new Date().toISOString(),
            });

            Toast.show({
                type: 'success',
                text1: 'Request Submitted',
                text2: 'Your subscription is pending admin review.',
                position: 'bottom',
            });

            router.back();
        } catch (error) {
            console.error('Subscription error:', error);
            Alert.alert('Upload Failed', error.message || 'Could not submit your request.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-primary px-6">
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: '#161622' },
                    headerTintColor: '#FFFFFF',
                    title: 'Premium Upgrade',
                }}
            />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}>

                <View className="items-center mb-8">
                    <View className="w-16 h-16 bg-secondary/20 rounded-full items-center justify-center mb-4">
                        <CheckCircle2 size={32} color="#FF9C01" />
                    </View>
                    <Text className="text-white text-3xl font-poppins_bold text-center">
                        Upgrade to Premium
                    </Text>
                    <Text className="text-secondary text-2xl font-poppins_bold mt-2">
                        Rs. 500
                    </Text>
                    <Text className="text-white/60 text-center mt-2 font-poppins px-4">
                        Unlock advanced features like Video Hide and Video Extract by becoming a Premium user.
                    </Text>
                </View>

                <View className="bg-black-100 rounded-3xl p-6 border border-white/10 mb-8">
                    <Text className="text-white text-lg font-poppins_semibold mb-4">
                        Bank Account Details
                    </Text>
                    <View className="mb-3">
                        <Text className="text-white/60 text-sm font-poppins">Account Title</Text>
                        <Text className="text-white text-base font-poppins_medium">HushTalk Official</Text>
                    </View>
                    <View className="mb-3">
                        <Text className="text-white/60 text-sm font-poppins">Account Number</Text>
                        <Text className="text-white text-base font-poppins_medium">1234 5678 9012 3456</Text>
                    </View>
                    <View>
                        <Text className="text-white/60 text-sm font-poppins">Bank Name</Text>
                        <Text className="text-white text-base font-poppins_medium">Meezan Bank Ltd.</Text>
                    </View>
                </View>

                <View className="mb-8">
                    <Text className="text-white text-lg font-poppins_semibold mb-4">
                        Upload Payment Proof
                    </Text>

                    <Pressable
                        onPress={pickImage}
                        className={`border-2 border-dashed rounded-3xl items-center justify-center overflow-hidden flex-col
              ${screenshot ? 'border-secondary/50 bg-secondary/5' : 'border-white/20 bg-black-100 h-40'}`}
                    >
                        {screenshot ? (
                            <Image
                                source={{ uri: screenshot.uri }}
                                className="w-full h-48 rounded-3xl"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="items-center">
                                <Upload size={32} color="#8D8DAA" />
                                <Text className="text-white/60 font-poppins mt-3">
                                    Tap to upload screenshot
                                </Text>
                            </View>
                        )}
                    </Pressable>
                    {screenshot && (
                        <Pressable onPress={pickImage} className="mt-3 self-center">
                            <Text className="text-secondary font-poppins_medium">Change Image</Text>
                        </Pressable>
                    )}
                </View>

                {uploading ? (
                    <View className="mb-4">
                        <ActivityIndicator size="large" color="#FF9C01" />
                    </View>
                ) : (
                    <AppButton
                        title="Submit Request"
                        onPress={handleSubmit}
                        disabled={!screenshot}
                    />
                )}

                {uploading && (
                    <Text className="text-white/60 text-center font-poppins text-xs mt-3">
                        Please wait while we securely upload your proof...
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
