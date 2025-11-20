import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { router } from "expo-router";
import { vaultItems } from "../../constants/dummy";
import AppButton from "../../components/AppButton";
import { LinearGradient } from "expo-linear-gradient";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";

const dialogOptions = [
  { label: "Image", id: "image" },
  { label: "Video", id: "video" },
];

export default function VaultScreen() {
  const [dialog, setDialog] = useState(null);

  const openDialog = (mode) => setDialog(mode);

  const handleSelection = (medium) => {
    setDialog(null);
    router.push(`/stegano/${dialog === "hide" ? "hide" : "extract"}`);
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
          <Pressable className="flex-row items-center mr-6">
            <Entypo name="download" size={16} color="#FF9C01" />
            <Text className="text-[#FF9C01] ml-2 font-poppins_medium">
              Download
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center">
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color="#FF4C4C"
            />
            <Text className="text-[#FF4C4C] ml-2 font-poppins_medium">
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-primary px-6 pt-16">
      {/* Title */}
      <Text className="text-3xl text-white font-poppins_bold mb-6">
        Vault
      </Text>

      {/* Top Card (Primary background with Secondary buttons) */}
<View className="bg-primary border border-white/10 rounded-2xl p-6 mb-8">
  

  <View className="flex-row gap-3">
    <AppButton
      title="Hide Message"
      className="flex-1"
      onPress={() => openDialog('hide')}
    />

    <AppButton
      title="Extract Message"
      variant="secondary"
      className="flex-1"
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
  },
});
