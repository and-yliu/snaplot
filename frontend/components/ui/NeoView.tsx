import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export function NeoView({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <View style={styles.shadow} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
  content: {
    backgroundColor: Colors.neo.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.neo.border,
    padding: 16,
    overflow: 'hidden', // Ensures content respects border radius
  },
});
