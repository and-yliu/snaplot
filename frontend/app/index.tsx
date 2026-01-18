import { useState, useEffect } from 'react';
import { Text, View, TouchableWithoutFeedback, Keyboard, Alert, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { useSocket } from '@/hooks/useSocket';
import { FloatingBackground } from '@/components/FloatingBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const fullWidthButtonStyle = { width: '100%' } as const;

// Neo Brutalism Animated Logo Component
const SnapPlotLogo = () => {
  const snapRotation = useSharedValue(-3);
  const plotRotation = useSharedValue(2);
  const cameraScale = useSharedValue(1);
  const decorDot2Scale = useSharedValue(0);

  useEffect(() => {
    // Subtle idle animation for SNAP box
    snapRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle idle animation for PLOT box
    plotRotation.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Camera pulse animation
    cameraScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pop in decorative dot
    decorDot2Scale.value = withDelay(400, withSpring(1, { damping: 8 }));
  }, []);

  const snapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${snapRotation.value}deg` }],
  }));

  const plotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plotRotation.value}deg` }],
  }));

  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: '15deg' }, { scale: cameraScale.value }],
  }));



  const decorDot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: decorDot2Scale.value }],
  }));

  return (
    <Animated.View
      style={styles.logoContainer}
      entering={FadeIn.duration(600).springify()}
    >
      {/* SNAP text with neo brutalist box */}
      <Animated.View style={[styles.snapBox, snapAnimatedStyle]}>
        <Text style={styles.snapText}>SNAP</Text>
      </Animated.View>

      {/* PLOT text with offset neo brutalist box */}
      <Animated.View style={[styles.plotBox, plotAnimatedStyle]}>
        <Text style={styles.plotText}>PLOT</Text>
      </Animated.View>

      {/* Camera icon accent */}
      <View style={styles.cameraIconContainer}>
        <Animated.View style={[styles.cameraBody, cameraAnimatedStyle]}>
          <View style={styles.cameraLens} />
        </Animated.View>
      </View>

      {/* Decorative elements */}
      <Animated.View style={[styles.decorDot2, decorDot2Style]} />
      <View style={styles.decorLine} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  snapBox: {
    backgroundColor: '#FCE762', // Bright yellow
    borderWidth: 4,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 8,
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
    marginLeft: 20,
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
  // Form container styles
  formContainer: {
    width: '100%',
    maxWidth: 340,
    paddingHorizontal: 8,
  },
  tagline: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  buttonSpacing: {
    marginBottom: 4,
  },
  orText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    marginVertical: 12,
    opacity: 0.5,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const { isConnected, error, createLobby, pendingNavigation, clearPendingNavigation } = useSocket();

  // Connection indicator animation
  const indicatorOpacity = useSharedValue(0);

  useEffect(() => {
    indicatorOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

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
      {/* Floating Background Elements - Behind everything */}
      <FloatingBackground />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 w-full">
          {/* Main content area with flex distribution */}
          <View className="flex-1 justify-center items-center px-6">
            {/* Logo section - takes upper portion */}
            <View className="items-center mb-10">
              <SnapPlotLogo />
            </View>

            {/* Form section - centered with max width */}
            <Animated.View
              style={styles.formContainer}
              entering={FadeInDown.delay(200).duration(500).springify()}
            >
              {/* Nickname Input */}
              <View style={{ marginBottom: 24 }}>
                <NeoInput
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                  rounded="none"
                />
              </View>

              {/* Create Game Button */}
              <Animated.View
                style={styles.buttonSpacing}
                entering={FadeInDown.delay(350).duration(400)}
              >
                <NeoButton
                  title="Create a Game"
                  onPress={handleCreateGame}
                  variant="primary"
                  style={fullWidthButtonStyle}
                />
              </Animated.View>

              {/* Or separator */}
              <Animated.Text
                style={styles.orText}
                entering={FadeIn.delay(450).duration(300)}
              >
                — or —
              </Animated.Text>

              {/* Join Game Button */}
              <Animated.View entering={FadeInDown.delay(500).duration(400)}>
                <NeoButton
                  title="Join a Game"
                  onPress={handleJoinGame}
                  variant="outline"
                  style={fullWidthButtonStyle}
                />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Connection indicator at bottom */}
          <Animated.View
            className="flex-row items-center justify-center pb-6"
            style={indicatorStyle}
          >
            <View
              className="h-2 w-2 rounded-full mr-1.5"
              style={{ backgroundColor: isConnected ? '#4CAF50' : '#F44336' }}
            />
            <Text
              className="text-xs"
              style={{ fontFamily: 'Nunito_600SemiBold', color: '#666' }}
            >
              {isConnected ? 'Connected to server' : 'Connecting...'}
            </Text>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

    </SafeAreaView>
  );
}

