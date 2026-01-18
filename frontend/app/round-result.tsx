import { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoView } from '@/components/ui/NeoView';
import { SERVER_URL, useSocket } from '@/hooks/useSocket';

export default function RoundResultScreen() {
  const router = useRouter();
  const {
    roundResult,
    roundResultContext,
    nextRoundStatus,
    readyForNextRound,
    currentRound,
    pendingNavigation,
    clearPendingNavigation,
    remoteReactions,
    consumeReaction,
    sendReaction,
  } = useSocket();

  // Animation States
  const [step, setStep] = useState(0); // 0: Init, 1: Criteria, 2: Winner, 3: Comment, 4: Done
  const opacityAnim = useRef(new Animated.Value(0)).current; // For Comment Card
  const hasRun = useRef(false); // Ref to prevent double execution
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  const criteria = roundResultContext?.criteria ?? '';
  const theme = roundResultContext?.theme ?? '';
  const winnerName = roundResult?.winnerName ?? '';
  const winnerText = theme ? `${winnerName} would use this: ${theme}` : `${winnerName} wins this round`;
  const comment = roundResult?.oneliner ?? '';
  const winnerPhotoUrl = roundResult?.photoPath
    ? `${SERVER_URL}/${roundResult.photoPath.replace(/^\/+/, '')}`
    : null;

  // Load audio on mount
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('@/assets/audios/drum_roll.mp3')
        );
        soundRef.current = sound;
      } catch (error) {
        console.log('Error loading sound', error);
      }
    };
    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    hasRun.current = false;
    opacityAnim.setValue(0);
    setStep(0);
    setHasConfirmed(false);
  }, [roundResult?.round, opacityAnim]);

  useEffect(() => {
    if (!roundResult) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const runSequence = async () => {
      // Step 0: Initial State (Just "Criteria:" label logic handled in render)

      // Step 1: Reveal Criteria Content
      try {
        if (soundRef.current) await soundRef.current.replayAsync();
      } catch (e) {
        console.log('Audio play error', e);
      } // Play Drum Roll

      // Wait 2s for drum roll to finish/reach peak
      setTimeout(() => {
        setStep(1); // Show Criteria Text

        // GAP 1: 1s sleep after criteria content shown
        setTimeout(() => {
          // Step 2: Winner Reveal
          const playSecond = async () => {
            try {
              if (soundRef.current) await soundRef.current.replayAsync();
            } catch (e) { }
          };
          playSecond();

          // Wait 2s
          setTimeout(() => {
            setStep(2); // Show Winner Info

            // GAP 2: 1s pause before Judge's Comment
            setTimeout(() => {
              setStep(3);
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 3000, // Longer ease-in (3s)
                useNativeDriver: true,
              }).start(() => {
                // Step 4: Final Actions
                setStep(4);
              });
            }, 1000); // Increased delay to ensure 1s+ gap
          }, 2000);
        }, 1000); // 1s gap between criteria and next drum roll
      }, 2000);
    };

    runSequence();
  }, [opacityAnim, roundResult]); // Depend on player availability

  // ... rest of the component


  useEffect(() => {
    if (!roundResult?.round) return;
    if (!currentRound?.round) return;
    if (currentRound.round === roundResult.round + 1) {
      router.replace('/game');
    }
  }, [currentRound?.round, roundResult?.round, router]);

  useEffect(() => {
    if (pendingNavigation?.type !== 'game') return;
    clearPendingNavigation();
    router.replace('/game');
  }, [pendingNavigation, clearPendingNavigation, router]);

  // Navigate to story-result when game is complete
  useEffect(() => {
    if (pendingNavigation?.type !== 'story-result') return;
    clearPendingNavigation();
    router.replace('/story-result');
  }, [pendingNavigation, clearPendingNavigation, router]);

  const handleReadyNextRound = () => {
    readyForNextRound();
    setHasConfirmed(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-neo-background" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1 w-full px-6 py-4">

        {/* Round Header */}
        <View className="w-full items-center mb-4">
          <Text
            className="text-base text-neo-text/60"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            ROUND {roundResult?.round ?? 1} WINNER
          </Text>
        </View>

        {/* Theme & Criteria Section */}
        <View className="w-full mb-4">
          <View className="mb-2">
            <Text
              className="text-sm text-neo-text/50 uppercase tracking-wider"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Theme
            </Text>
            <Text
              className="text-xl text-neo-text"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {step >= 1 ? theme : '...'}
            </Text>
          </View>
          <View>
            <Text
              className="text-sm text-neo-text/50 uppercase tracking-wider"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Criteria
            </Text>
            <Text
              className="text-xl text-neo-text"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {step >= 1 ? criteria : '...'}
            </Text>
          </View>
        </View>

        {/* Winner Section with Comment */}
        {step >= 2 && (
          <View className="w-full relative">
            {/* Winner Photo */}
            <View className="w-full rounded-2xl aspect-square bg-white border-2 border-neo-border overflow-hidden">
              {winnerPhotoUrl ? (
                <Image
                  source={{ uri: winnerPhotoUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : null}
            </View>

            {/* Winner Name Tag - overlaid on top right */}
            <View className="absolute top-3 right-3 bg-black px-4 py-1.5 rounded-full">
              <Text
                className="text-base text-white"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {winnerName}
              </Text>
            </View>
          </View>
        )}

        {/* Judge's Comment - grouped with image */}
        <Animated.View style={{ opacity: opacityAnim, width: '100%', marginTop: 16 }}>
          {step >= 3 && (
            <NeoView className="w-full bg-[#FFF5EB] p-4 mt-3">
              <Text
                className="text-xl text-[#4caf50]"
                style={{ fontFamily: 'Nunito_600SemiBold', lineHeight: 26 }}
              >
                "{comment}"
              </Text>
            </NeoView>
          )}
        </Animated.View>

      </View>

      {/* Fixed Footer - Reactions & Ready Button */}
      {step >= 4 && (
        <View className="absolute bottom-0 left-0 right-0 px-6 mb-10 pt-3 bg-neo-background gap-6">
          {/* Remote reactions from other players */}
          <View className="absolute -top-12 left-0 right-0 items-center pointer-events-none">
            {remoteReactions.map((reaction) => (
              <FlyingEmoji
                key={reaction.id}
                icon={reaction.icon}
                color="#E8C547"
                onComplete={() => consumeReaction(reaction.id)}
              />
            ))}
          </View>

          <View className="flex-row justify-between w-full mb-2.5 z-10">
            <NeoReactionButton icon="thumbs-up" color="#E8C547" onSend={sendReaction} />
            <NeoReactionButton icon="thumbs-down" color="#E8C547" onSend={sendReaction} />
            <NeoReactionButton icon="egg" color="#E8C547" onSend={sendReaction} />
            <NeoReactionButton icon="rose" color="#FF6B6B" onSend={sendReaction} />
          </View>

          <NeoButton
            title={
              hasConfirmed
                ? 'READY ✓'
                : `READY (${nextRoundStatus?.readyCount ?? 0}/${nextRoundStatus?.totalPlayers ?? 0})`
            }
            onPress={handleReadyNextRound}
            variant="primary"
            className="w-full"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper for Neo Reaction Buttons
type IconName = ComponentProps<typeof Ionicons>['name'];

function NeoReactionButton({ icon, color, onSend }: { icon: IconName; color: string; onSend: (icon: string) => void }) {
  const [reactions, setReactions] = useState<number[]>([]);

  const handlePress = () => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [...prev, id]);
    onSend(icon);  // Send to other players
  };

  const removeReaction = (id: number) => {
    setReactions((prev) => prev.filter((r) => r !== id));
  };

  return (
    <View className="w-[60px] h-[60px] relative">
      {/* Helper Wrapper for Z-Index context if needed, but absolute positioning in relative container works */}
      {reactions.map((id) => (
        <FlyingEmoji key={id} icon={icon} color={color} onComplete={() => removeReaction(id)} />
      ))}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        className="w-full h-full"
      >
        <View className="absolute top-1 left-1 w-full h-full bg-neo-shadow rounded-xl" />
        <View className="w-full h-full bg-neo-card border-2 border-neo-border rounded-xl justify-center items-center">
          <Ionicons name={icon} size={28} color={color} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function FlyingEmoji({ icon, color, onComplete }: { icon: IconName | string; color: string; onComplete: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(onComplete);
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100] // Fly up 100px
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 1, 0] // Fade out at end
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0.5, 1.2, 1] // Pop effect
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        pointerEvents: 'none',
        transform: [{ translateY }, { scale }],
        opacity
      }}
    >
      <Ionicons name={icon as IconName} size={28} color={color} />
    </Animated.View>
  );
}
