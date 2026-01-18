import React, { useRef, useState } from 'react';
import { View, TextInput, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
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
    <View className="flex-row gap-3 justify-center w-full">
      {pin.map((digit, index) => (
        <View key={index} className="w-[60px] h-[70px] relative">
          <View className="absolute top-[4px] left-[4px] -right-[4px] -bottom-[4px] bg-neo-shadow rounded-none" />
          <TextInput
            ref={(ref) => {
              if (ref) inputs.current[index] = ref;
            }}
            className="w-full h-full bg-neo-card border-2 border-neo-border text-2xl text-center rounded-none text-neo-text"
            style={{ fontFamily: 'Nunito_700Bold' }}
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
