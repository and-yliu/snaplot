import { TextInput, TextInputProps, View } from 'react-native';

interface NeoInputProps extends TextInputProps {
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export function NeoInput({ style, rounded = 'xl', ...props }: NeoInputProps) {
  const roundedClass = `rounded-${rounded}`;

  return (
    <View className="relative h-[50px] w-full">
      <View className={`absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow ${roundedClass}`} />
      <TextInput
        className={`w-full h-full bg-neo-card border-2 border-neo-border px-4 text-base text-neo-text ${roundedClass}`}
        style={[{ fontFamily: 'Nunito_600SemiBold' }, style]}
        placeholderTextColor="#666" // Darker placeholder for contrast
        {...props}
      />
    </View>
  );
}
