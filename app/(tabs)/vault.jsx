import { useState, useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from "react-native";
import Toast from 'react-native-toast-message';
import { router } from "expo-router";
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Query } from 'react-native-appwrite';

import AppButton from "../../components/AppButton";
import { Download, Trash2, Image as ImageIcon, Lock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../../context/GlobalProvider";
import { databases, storage, APPWRITE_CONFIG } from "../../lib/appwriteConfig";

const dialogOptions = [
  { label: "Image", id: "image" },
  { label: "Video", id: "video" },
];

export default function VaultScreen() {
  const { user } = useGlobalContext();
  const [dialog, setDialog] = useState(null);
  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Logic
  const fetchVaultItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collectionId,
        [
          Query.equal('ownerId', user.uid),
          Query.orderDesc('$createdAt')
        ]
      );

      const items = response.documents.map(doc => ({
        id: doc.$id,
        fileId: doc.fileId,
        title: doc.fileName,
        fileType: doc.type,
        createdAt: new Date(doc.$createdAt).toLocaleDateString(),
        // Use /download endpoint (not /view) to get the raw unmodified file
        downloadUrl: `https://cloud.appwrite.io/v1/storage/buckets/${APPWRITE_CONFIG.bucketId}/files/${doc.fileId}/download?project=${APPWRITE_CONFIG.projectId}`,
        fileId: doc.fileId
      }));

      setVaultItems(items);
    } catch (error) {
      console.error("Error fetching vault items:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to refresh vault',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultItems();
  }, [user]);

  const openDialog = (mode) => setDialog(mode);

  const handleSelection = (medium) => {
    setDialog(null);
    const basePath = dialog === "hide" ? "hide" : "extract";
    const mediaType = medium === "image" ? "image" : "video";
    router.push(`/stegano/${basePath}-${mediaType}`);
  };

  const handleDownload = async (item) => {
    try {
      // Ensure filename ends with .png to preserve format
      let fileName = item.title;
      if (!fileName.toLowerCase().endsWith('.png')) {
        fileName = fileName.replace(/\.[^.]+$/, '') + '.png';
      }

      // Download to cache directory first (raw bytes, no modification)
      const cacheUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        item.downloadUrl,
        cacheUri,
        {},
        null
      );

      const result = await downloadResumable.downloadAsync();

      if (!result || !result.uri) {
        throw new Error('Download failed - no file URI returned');
      }

      // Use Storage Access Framework to save directly without modification
      // Request permission to access a directory where user wants to save
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert('Permission needed', 'Please select a folder to save the image.');
        return;
      }

      // Read the downloaded file as base64
      const fileContent = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create file directly in the chosen directory (no modification)
      const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'image/png'
      );

      // Write the exact bytes to the new file
      await FileSystem.writeAsStringAsync(newFileUri, fileContent, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Clean up cache
      await FileSystem.deleteAsync(result.uri, { idempotent: true });

      Toast.show({
        type: 'success',
        text1: 'Download Complete',
        text2: 'Image saved without modification',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Download error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to download file',
        position: 'bottom'
      });
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Delete from Storage
              await storage.deleteFile(APPWRITE_CONFIG.bucketId, item.fileId);

              // 2. Delete from Database
              await databases.deleteDocument(
                APPWRITE_CONFIG.databaseId,
                APPWRITE_CONFIG.collectionId,
                item.id
              );

              // 3. Update local state
              setVaultItems(prev => prev.filter(i => i.id !== item.id));

              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Item removed successfully',
              });
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View className="bg-[#1E1E28] rounded-2xl p-4 mb-4 flex-row items-center">
      {/* Thumbnail Placeholder */}
      <View className="w-16 h-16 bg-black-200 rounded-xl mr-4 overflow-hidden items-center justify-center">
        <Image
          source={require('../../assets/images/splash-icon.png')}
          className="w-10 h-10"
          resizeMode="contain"
          style={{ tintColor: '#FF9C01' }}
        />
      </View>

      {/* Text Block */}
      <View className="flex-1">
        <Text className="text-white text-lg font-poppins_semibold">
          {item.title}
        </Text>
        <Text className="text-white/60 mt-0.5 font-poppins">{item.createdAt}</Text>
        <Text className="text-white/40 text-sm mt-1 font-poppins_light capitalize">{item.fileType}</Text>

        {/* Button Row */}
        <View className="flex-row mt-3 items-center">
          <Pressable
            className="flex-row items-center mr-6"
            onPress={() => handleDownload(item)}
          >
            <Download size={16} color="#FF9C01" />
            <Text className="text-[#FF9C01] ml-2 font-poppins_medium">
              Download
            </Text>
          </Pressable>

          <Pressable
            className="flex-row items-center"
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={16} color="#FF4C4C" />
            <Text className="text-[#FF4C4C] ml-2 font-poppins_medium">
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary px-6 pt-5">
      {/* Title */}
      <View className="flex-row items-center gap-2 mb-6">
        <Lock size={28} color="#FF9C01" />
        <Text className="text-3xl text-white font-poppins_bold">
          Vault
        </Text>
      </View>

      {/* Top Card (Primary background with Secondary buttons) */}
      <View className="bg-primary border border-white/10 rounded-2xl p-6 mb-8">


        <View className="flex-row gap-3">
          <AppButton
            title="Hide Message"
            className="flex-1"
            icon={<ImageIcon size={18} color="#FFFFFF" />}
            onPress={() => openDialog('hide')}
          />

          <AppButton
            title="Extract Message"
            variant="secondary"
            className="flex-1"
            icon={<Lock size={18} color="#FFFFFF" />}
            onPress={() => openDialog('extract')}
          />
        </View>
      </View>


      {/* Section Title */}
      <Text className="text-white text-xl font-poppins_semibold mb-4">
        Steganified Media
      </Text>

      {/* List */}
      <FlatList
        data={vaultItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        refreshing={loading}
        onRefresh={fetchVaultItems}
        ListEmptyComponent={
          !loading && (
            <Text className="text-center text-white/50 mt-16 font-poppins">
              Nothing hidden yet.
            </Text>
          )
        }
      />

      {/* Dialog Modal */}
      <Modal
        visible={!!dialog}
        transparent
        animationType="fade"
        onRequestClose={() => setDialog(null)}
      >
        <View className="flex-1 bg-black/70 items-center justify-center px-6">
          <View className="w-full bg-black-100 rounded-3xl p-6">
            <Text className="text-2xl text-white font-poppins_bold mb-4">
              {dialog === "hide"
                ? "Hide message"
                : "Extract message"}
            </Text>
            <Text className="text-1xl text-white font-poppins_bold mb-4">
              {dialog === "hide"
                ? "Choose the type of media to hide your message in"
                : "Choose the type of media to extract the hidden message from"}
            </Text>

            {dialogOptions.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => handleSelection(option.id)}
                className="rounded-2xl p-4 mb-3 bg-secondary text-center"
              >
                <Text className="text-black-100 text-center text-lg font-poppins_medium">
                  {option.label}
                </Text>
              </Pressable>
            ))}

            <AppButton
              title="Cancel"
              variant="secondary"
              onPress={() => setDialog(null)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
  },
});
