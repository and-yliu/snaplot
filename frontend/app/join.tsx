import { useState, useEffect } from 'react';
import { Text, View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoPinInput } from '@/components/ui/NeoPinInput';
import { useSocket } from '@/hooks/useSocket';

const fullWidthButtonStyle = { width: '100%' } as const;

export default function JoinScreen() {
  const router = useRouter();
  const { nickname } = useLocalSearchParams<{ nickname: string }>();
  const [pin, setPin] = useState('');
  const { isConnected, error, joinLobby, pendingNavigation, clearPendingNavigation } = useSocket();

  // Navigate when pending navigation is set (only on join)
  useEffect(() => {
    if (pendingNavigation && pendingNavigation.type === 'player-waiting-room') {
      clearPendingNavigation();
      router.push({
        pathname: '/player-waiting-room',
        params: {
          nickname,
          roomPin: pendingNavigation.roomPin,
        }
      });
    }
  }, [pendingNavigation]);

  // Show error if join fails
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleJoinRoom = () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-character room PIN');
      return;
    }
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please try again.');
      return;
    }

    console.log('Joining room with PIN:', pin, 'Nickname:', nickname);
    // Join lobby via socket
    joinLobby(pin, nickname || 'Player');
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-background">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center px-6">
            <Text
              className="text-2xl text-center mb-5 text-neo-text"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Enter the 4-digit Room PIN
            </Text>

            <View className="flex-row items-center mb-5">
              <View
                className="h-2 w-2 rounded-full mr-1.5"
                style={{ backgroundColor: isConnected ? '#4CAF50' : '#F44336' }}
              />
              <Text
                className="text-xs text-neo-text"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {isConnected ? 'Connected' : 'Connecting...'}
              </Text>
            </View>

            <View className="w-full mb-10 items-center">
              <NeoPinInput
                length={4}
                onComplete={(code) => setPin(code)}
              />
            </View>

            <View className="w-full px-6">
              <NeoButton
                title="Join Room"
                onPress={handleJoinRoom}
                variant="primary"
                style={fullWidthButtonStyle}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
