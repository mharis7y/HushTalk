import { useState } from "react";
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
import { vaultItems as initialVaultItems } from "../../constants/dummy";
import AppButton from "../../components/AppButton";
import { Download, Trash2, Image as ImageIcon, Lock } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const dialogOptions = [
  { label: "Image", id: "image" },
  { label: "Video", id: "video" },
];

export default function VaultScreen() {
  const [dialog, setDialog] = useState(null);
  const [vaultItems, setVaultItems] = useState(initialVaultItems);

  const openDialog = (mode) => setDialog(mode);

  const handleSelection = (medium) => {
    setDialog(null);
    const basePath = dialog === "hide" ? "hide" : "extract";
    const mediaType = medium === "image" ? "image" : "video";
    router.push(`/stegano/${basePath}-${mediaType}`);
  };

  const handleDownload = (item) => {
    Toast.show({
      type: 'success',
      text1: 'Image Download',
      text2: 'Image saved to gallery!',
      position: 'bottom',
    });
  };

  const handleDelete = (itemId) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setVaultItems((prev) => prev.filter((item) => item.id !== itemId));
            Alert.alert('Success', 'Item deleted successfully!');
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View className="bg-[#1E1E28] rounded-2xl p-4 mb-4 flex-row items-center">
      {/* Thumbnail Placeholder */}
      <View className="w-16 h-16 bg-black-200 rounded-xl mr-4 overflow-hidden">
        <Image
          source={{
            uri:
              item.thumbnail ??
              "https://via.placeholder.com/100x100.png?text=IMG",
          }}
          className="w-full h-full"
        />
      </View>

      {/* Text Block */}
      <View className="flex-1">
        <Text className="text-white text-lg font-poppins_semibold">
          {item.title}
        </Text>
        <Text className="text-white/60 mt-0.5 font-poppins">{item.createdAt}</Text>
        <Text className="text-white/40 text-sm mt-1 font-poppins_light">{item.fileType}</Text>

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
            onPress={() => handleDelete(item.id)}
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
        ListEmptyComponent={
          <Text className="text-center text-white/50 mt-16">
            Nothing hidden yet.
          </Text>
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
