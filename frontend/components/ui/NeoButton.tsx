import { TouchableOpacity, Text, ViewStyle, GestureResponderEvent, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface NeoButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  className?: string;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

export function NeoButton({
  title,
  onPress,
  variant = 'primary',
  style,
  className,
  backgroundColor,
  textColor,
  disabled,
}: NeoButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return '#E0E0E0'; // Fallback if disabled color not defined
    if (backgroundColor) return backgroundColor;
    switch (variant) {
      case 'primary':
        return Colors.neo.primary;
      case 'secondary':
        return Colors.neo.secondary;
      case 'outline':
        return Colors.neo.card;
      default:
        return Colors.neo.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666666';
    if (textColor) return textColor;
    return Colors.neo.text;
  };

  const backgroundClassName =
    variant === 'secondary'
      ? 'bg-neo-secondary'
      : variant === 'outline'
        ? 'bg-neo-card'
        : 'bg-neo-primary';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`relative h-[50px] ${className ?? ''}`}
      style={style}
      disabled={disabled}
    >
      <View className="absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow rounded-none" />
      <View
        className={`h-full border-2 border-neo-border items-center justify-center rounded-none ${backgroundClassName}`}
        style={backgroundColor ? { backgroundColor: getBackgroundColor() } : undefined}
      >
        <Text
          className="text-base text-center text-neo-text"
          style={{ fontFamily: 'Nunito_700Bold', color: getTextColor() }}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity >
  );
}
