import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  // Request camera permission when component mounts
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, []);

  const handleCreateGame = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    // Navigate to host waiting room
    console.log('Create Game with nickname:', nickname);
    router.push({ pathname: '/host-waiting-room', params: { nickname } });
  };

  const handleJoinGame = () => {
    if (!nickname.trim()) {
      alert('Please enter a nickname');
      return;
    }
    // Navigate to join game flow with nickname
    console.log('Join Game with nickname:', nickname);
    router.push({ pathname: '/join', params: { nickname } });
  };

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoid}
          >
            <View style={styles.content}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/snapplot_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.inputContainer}>
                <NeoInput
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.createButtonContainer}>
                <NeoButton
                  title="➕Create a Game"
                  onPress={handleCreateGame}
                  variant="primary"
                  style={styles.button}
                />
              </View>

              <View style={styles.buttonContainer}>
                <NeoButton
                  title="👥 Join a Game"
                  onPress={handleJoinGame}
                  variant="outline"
                  style={styles.button}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center content vertically
    paddingHorizontal: 20,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.neo.background,
  },
  titleContainer: {
    marginBottom: 50, // Space between title and input
  },
  title: {
    fontSize: 48,
    fontFamily: 'Nunito_700Bold',
    color: '#000', // Black text
    textAlign: 'center',
    lineHeight: 56, // Adjust for tighter stacking if needed
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30, // Space between input and buttons
    height: 50,
  },
  createButtonContainer: {
    width: '100%',
    marginBottom: 20, // Space between Create button and Join button
  },
  buttonContainer: {
    width: '100%',
    gap: 15, // Space between buttons
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    marginBottom: 32,
    marginTop: -150,
    alignItems: 'center',
  },
  logo: {
    width: 370,
    height: 150,
  },
  button: {
    width: '100%',
  },
});
