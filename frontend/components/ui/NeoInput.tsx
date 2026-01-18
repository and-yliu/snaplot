import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/theme';

export function NeoInput({ style, ...props }: TextInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.shadow} />
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor="#666" // Darker placeholder for contrast
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 50,
    width: '100%',
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: Colors.neo.shadow,
    borderRadius: 12,
  },
  input: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neo.card,
    borderWidth: 2,
    borderColor: Colors.neo.border,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.neo.text,
    borderRadius: 12,
  },
});
