import { TouchableOpacity, Text, StyleSheet, ViewStyle, GestureResponderEvent, View } from 'react-native';
import { Colors } from '@/constants/theme';

interface NeoButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  backgroundColor?: string;
  textColor?: string;
}

export function NeoButton({ title, onPress, variant = 'primary', style, backgroundColor, textColor }: NeoButtonProps) {
  const getBackgroundColor = () => {
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
    if (textColor) return textColor;
    return Colors.neo.text;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.shadow} />
      <View style={[styles.content, { backgroundColor: getBackgroundColor() }]}>
        <Text style={[styles.text, { color: getTextColor() }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 50,
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: Colors.neo.shadow,
    borderRadius: 0,
  },
  content: {
    height: '100%',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: Colors.neo.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },
});
