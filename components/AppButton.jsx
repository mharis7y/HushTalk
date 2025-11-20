import { Pressable, Text, View } from 'react-native';

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  className = '',
  disabled = false,
}) {
  const base =
    'w-full flex-row items-center justify-center rounded-2xl px-4 py-3';
  const variants = {
    primary: 'bg-secondary-100',
    secondary: 'bg-black-200',
    ghost: 'bg-transparent border border-secondary-100',
  };

  return (
    <Pressable
      className={`${base} ${variants[variant]} ${
        disabled ? 'opacity-60' : ''
      } ${className}`}
      onPress={onPress}
      disabled={disabled}
    >
      {icon ? <View className="mr-2">{icon}</View> : null}
      <Text className="text-white text-base text-center font-poppins_semibold">
        {title}
      </Text>
    </Pressable>
  );
}


