import { useState, useEffect } from 'react';
import { Text, View, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { useSocket } from '@/hooks/useSocket';

const fullWidthButtonStyle = { width: '100%' } as const;

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const { isConnected, error, createLobby, pendingNavigation, clearPendingNavigation } = useSocket();

  // Request camera permission when component mounts
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, []);

  // Navigate when pending navigation is set (only on create)
  useEffect(() => {
    if (pendingNavigation && pendingNavigation.type === 'host-waiting-room') {
      clearPendingNavigation();
      router.push({
        pathname: '/host-waiting-room',
        params: {
          nickname,
          roomPin: pendingNavigation.roomPin
        }
      });
    }
  }, [pendingNavigation]);

  // Show error if lobby creation fails
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
    }
  }, [error]);

  const handleCreateGame = () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server. Please try again.');
      return;
    }
    // Create lobby via socket
    console.log('Create Game with nickname:', nickname);
    createLobby(nickname.trim());
  };

  const handleJoinGame = () => {
    if (!nickname.trim()) {
      Alert.alert('Error', 'Please enter a nickname');
      return;
    }
    // Navigate to join game flow with nickname
    console.log('Join Game with nickname:', nickname);
    router.push({ pathname: '/join', params: { nickname } });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.neo.background }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 w-full"
        >
          <View className="flex-1 items-center justify-center px-6">
            <View className="items-center mb-8 -mt-36">
              <Image
                source={require('@/assets/images/snapplot_logo.png')}
                className="w-[370px] h-[150px]"
                resizeMode="contain"
              />
            </View>

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

            <View className="w-full mb-8">
              <NeoInput
                placeholder="Nickname"
                value={nickname}
                onChangeText={setNickname}
                autoCorrect={false}
              />
            </View>

            <View className="w-full mb-5">
              <NeoButton
                title="Create a Game"
                onPress={handleCreateGame}
                variant="primary"
                style={fullWidthButtonStyle}
              />
            </View>

            <View className="w-full gap-4">
              <NeoButton
                title="Join a Game"
                onPress={handleJoinGame}
                variant="outline"
                style={fullWidthButtonStyle}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
