import { ActivityIndicator, Modal, View } from 'react-native';

function Loader({ overlay = false }) {
  if (overlay) {
    return (
      <Modal transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <ActivityIndicator size="large" color="#FF9C01" />
        </View>
      </Modal>
    );
  }

  return (
    <View className="py-6">
      <ActivityIndicator size="small" color="#FF9C01" />
    </View>
  );
}

Loader.displayName = 'Loader';

export default Loader;


