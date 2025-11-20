import { TextInput, Text, View } from 'react-native';

export default function AppInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
}) {
  return (
    <View className="w-full gap-2">
      {label ? (
        <Text className="text-white font-poppins_medium">{label}</Text>
      ) : null}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#8D8DAA"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        className="bg-raisin border border-charcoal rounded-2xl px-4 py-3 text-white font-poppins"
      />
    </View>
  );
}


