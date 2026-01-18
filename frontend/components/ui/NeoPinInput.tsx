import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '@/constants/theme';


interface NeoPinInputProps {
  length?: number;
  onComplete?: (pin: string) => void;
}

export function NeoPinInput({ length = 4, onComplete }: NeoPinInputProps) {
  const [pin, setPin] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    // Auto-focus next input
    if (text.length === 1 && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // Check completion
    if (newPin.every((digit) => digit !== '') && onComplete) {
      onComplete(newPin.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && pin[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {pin.map((digit, index) => (
        <View key={index} style={styles.inputWrapper}>
          <View style={styles.shadow} />
          <TextInput
            ref={(ref) => {
              if (ref) inputs.current[index] = ref;
            }}
            style={styles.input}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            returnKeyType="done"
            selectionColor={Colors.neo.primary}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  inputWrapper: {
    width: 60,
    height: 70,
    position: 'relative',
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
  input: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neo.card,
    borderWidth: 2,
    borderColor: Colors.neo.border,
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
    color: Colors.neo.text,
    borderRadius: 0,
  },
});
