import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { Colors } from '@/constants/theme';
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

  const criteria = roundResultContext?.criteria ?? '';
  const theme = roundResultContext?.theme ?? '';
  const winnerName = roundResult?.winnerName ?? '';
  const winnerText = theme ? `${winnerName} would use this: ${theme}` : `${winnerName} wins this round`;
  const comment = roundResult?.oneliner ?? '';
  const winnerPhotoUrl = roundResult?.photoPath
    ? `${SERVER_URL}/${roundResult.photoPath.replace(/^\/+/, '')}`
    : null;

  const player = useAudioPlayer(require('@/assets/audios/drum_roll.mp3'));

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
      player.play(); // Play Drum Roll

      // Wait 2s for drum roll to finish/reach peak
      setTimeout(() => {
        setStep(1); // Show Criteria Text

        // GAP 1: 1s sleep after criteria content shown
        setTimeout(() => {
          // Step 2: Winner Reveal
          player.seekTo(0); // Reset audio
          player.play(); // Play again

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
  }, [opacityAnim, player, roundResult]); // Depend on player availability

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

  const handleReadyNextRound = () => {
    readyForNextRound();
    setHasConfirmed(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.content}>

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.criteriaLabel}>Criteria: {step >= 1 ? criteria : ''}</Text>
        </View>

        {/* Winner Section */}
        {step >= 2 && (
          <View style={styles.winnerContainer}>
            <Text style={styles.winnerText}>
              {winnerText}
            </Text>
            {/* Image Placeholder - Replicating the Cup Image style */}
            <View style={styles.imageContainer}>
              {/* Using a placeholder view for now as I don't have the specific cup image asset */}
              {winnerPhotoUrl ? (
                <Image
                  source={{ uri: winnerPhotoUrl }}
                  style={styles.winnerImage}
                  resizeMode="cover"
                />
              ) : null}
            </View>
          </View>
        )}

        {/* Judge's Comment */}
        <Animated.View style={{ opacity: opacityAnim, width: '100%', marginBottom: 10 }}>
          {step >= 3 && (
            <NeoView style={styles.commentNeoView}>
              {/* <Text style={styles.commentLabel}>Judge’s Comment:</Text> */}
              <Text style={styles.commentText}>{comment}</Text>
            </NeoView>
          )}
        </Animated.View>

        {/* Reactions & Footer */}
        {step >= 4 && (
          <View style={styles.footerContainer}>
            {/* Remote reactions from other players */}
            <View style={styles.remoteReactionsContainer}>
              {remoteReactions.map((reaction) => (
                <FlyingEmoji
                  key={reaction.id}
                  icon={reaction.icon}
                  color="#E8C547"
                  onComplete={() => consumeReaction(reaction.id)}
                />
              ))}
            </View>

            <View style={styles.reactionsRow}>
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
              style={styles.nextButton}
            />
          </View>
        )}

      </View>
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
    <View style={styles.reactionContainer}>
      {/* Helper Wrapper for Z-Index context if needed, but absolute positioning in relative container works */}
      {reactions.map((id) => (
        <FlyingEmoji key={id} icon={icon} color={color} onComplete={() => removeReaction(id)} />
      ))}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={styles.touchableReaction}
      >
        <View style={styles.reactionShadow} />
        <View style={styles.reactionContent}>
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
    <Animated.View style={[
      styles.flyingEmoji,
      {
        transform: [{ translateY }, { scale }],
        opacity
      }
    ]}>
      <Ionicons name={icon as IconName} size={28} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neo.background, // Beige
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    width: '100%',
    paddingBottom: 20,
    paddingTop: 20,
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
  },
  criteriaLabel: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'left',
  },
  winnerContainer: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  winnerText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 5,
    color: '#000',
    lineHeight: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderWidth: 2, // Neo border
    borderColor: Colors.neo.border,
    marginBottom: 5,
    overflow: 'hidden',
  },
  winnerImage: {
    width: '100%',
    height: '100%',
  },
  // NeoView handles container styles, but we can override if needed
  commentNeoView: {
    width: '100%',
    backgroundColor: '#FFF5EB',
  },
  commentLabel: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#C89B7B',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: '#C89B7B',
    lineHeight: 24,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5,
    zIndex: 10,
  },
  remoteReactionsContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  // Custom Neo Button Styles for Icons
  reactionContainer: {
    width: 60,
    height: 60,
    position: 'relative',
    // No overflow hidden so emoji can fly out
  },
  touchableReaction: {
    width: '100%',
    height: '100%',
  },
  reactionShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neo.shadow,
    borderRadius: 12,
  },
  reactionContent: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.neo.card,
    borderWidth: 2,
    borderColor: Colors.neo.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flyingEmoji: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, // Center horizontally in container
    bottom: 0, // Center vertically in container
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Top
    pointerEvents: 'none', // Don't block clicks while flying (though it moves fast)
  },
  nextButton: {
    width: '100%',
  }
});
