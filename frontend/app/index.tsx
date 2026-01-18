import { useState } from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';

export default function HomeScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');

  const handleCreateGame = () => {
    // Navigate to create game flow
    console.log('Create Game with nickname:', nickname);
    router.push('/game'); // Navigate to game flow
  };

  const handleJoinGame = () => {
    // Navigate to join game flow
    console.log('Join Game');
    router.push('/join');
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
                <Text style={styles.label}>Please enter your nickname</Text>
                <NeoInput
                  placeholder="Nickname"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.buttonContainer}>
                <NeoButton
                  title="➕Create a Game"
                  onPress={handleCreateGame}
                  variant="primary"
                  style={styles.button}
                />
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
  background: {
    flex: 1,
    backgroundColor: Colors.neo.background,
  },
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neo.text,
    marginBottom: 12,
    opacity: 0.9,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
});
