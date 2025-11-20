import { View, Text } from 'react-native';

export default function Header({ title, subtitle, rightSlot }) {
  return (
    <View className="flex-row items-start justify-between mb-6">
      <View className="flex-1 pr-4">
        <Text className="text-sm text-secondary font-poppins_medium uppercase tracking-[2px] mb-1">
          {subtitle}
        </Text>
        <Text className="text-3xl text-white font-poppins_bold">
          {title}
        </Text>
      </View>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}


