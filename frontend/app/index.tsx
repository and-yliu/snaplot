import { useState, useEffect } from 'react';
import { Text, View, TouchableWithoutFeedback, Keyboard, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { useSocket } from '@/hooks/useSocket';

const fullWidthButtonStyle = { width: '100%' } as const;

// Neo Brutalism Logo Component
const SnapPlotLogo = () => {
  return (
    <View style={styles.logoContainer}>
      {/* SNAP text with neo brutalist box */}
      <View style={styles.snapBox}>
        <Text style={styles.snapText}>SNAP</Text>
      </View>

      {/* PLOT text with offset neo brutalist box */}
      <View style={styles.plotBox}>
        <Text style={styles.plotText}>PLOT</Text>
      </View>

      {/* Camera icon accent */}
      <View style={styles.cameraIconContainer}>
        <View style={styles.cameraBody}>
          <View style={styles.cameraLens} />
        </View>
      </View>

      {/* Decorative elements */}
      <View style={styles.decorDot1} />
      <View style={styles.decorDot2} />
      <View style={styles.decorLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: -80,
    position: 'relative',
  },
  snapBox: {
    backgroundColor: '#FCE762', // Bright yellow
    borderWidth: 4,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 8,
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 2,
  },
  snapText: {
    fontFamily: 'Audiowide_400Regular',
    fontSize: 52,
    color: '#000000',
    letterSpacing: 4,
  },
  plotBox: {
    backgroundColor: '#FF6B6B', // Coral red
    borderWidth: 4,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginTop: -12,
    marginLeft: 40,
    transform: [{ rotate: '2deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    zIndex: 1,
  },
  plotText: {
    fontFamily: 'Audiowide_400Regular',
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  cameraIconContainer: {
    position: 'absolute',
    top: -20,
    right: -10,
    zIndex: 3,
  },
  cameraBody: {
    width: 44,
    height: 32,
    backgroundColor: '#4CAF50', // Green
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '15deg' }],
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  cameraLens: {
    width: 16,
    height: 16,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  decorDot1: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#FFA6C9', // Pink
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    top: 20,
    left: -20,
  },
  decorDot2: {
    position: 'absolute',
    width: 16,
    height: 16,
    backgroundColor: '#87CEEB', // Sky blue
    borderWidth: 2,
    borderColor: '#000000',
    top: 100,
    right: -15,
  },
  decorLine: {
    position: 'absolute',
    width: 40,
    height: 4,
    backgroundColor: '#000000',
    bottom: -20,
    left: 20,
    transform: [{ rotate: '-10deg' }],
  },
});

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
        <View className="flex-1 w-full">
          <View className="flex-1 items-center justify-center px-6">
            {/* Neo Brutalism Logo */}
            <SnapPlotLogo />

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
                rounded="none"
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
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
