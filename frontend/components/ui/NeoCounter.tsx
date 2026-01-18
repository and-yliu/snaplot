import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';


interface NeoCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function NeoCounter({ label, value, onChange, min = 0, max = 100, step = 1 }: NeoCounterProps) {
  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.counterWrapper}>
        <View style={styles.shadow} />
        <View style={styles.counterContent}>
          <TouchableOpacity onPress={handleDecrement} style={styles.button}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.value}>{value}</Text>

          <TouchableOpacity onPress={handleIncrement} style={styles.button}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 20,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.neo.text,
    flex: 1,
  },
  counterWrapper: {
    width: 160,
    height: 50,
    position: 'relative',
  },
  shadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: Colors.neo.shadow,
    borderRadius: 8, // Slightly rounded for the pill shape
  },
  counterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neo.card, // White background
    borderWidth: 2,
    borderColor: Colors.neo.border,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  button: {
    width: 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: Colors.neo.text,
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.neo.text,
  },
});
