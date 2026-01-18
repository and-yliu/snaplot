import { TextInput, TextInputProps, View } from 'react-native';

export function NeoInput({ style, ...props }: TextInputProps) {
  return (
    <View className="relative h-[50px] w-full">
      <View className="absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow rounded-xl" />
      <TextInput
        className="w-full h-full bg-neo-card border-2 border-neo-border px-4 text-base rounded-xl text-neo-text"
        style={[{ fontFamily: 'Nunito_600SemiBold' }, style]}
        placeholderTextColor="#666" // Darker placeholder for contrast
        {...props}
      />
    </View>
  );
}
