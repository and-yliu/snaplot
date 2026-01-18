// eslint-disable-next-line import/namespace
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAudioPlayer } from 'expo-audio';

import { NeoButton } from '@/components/ui/NeoButton';
import { NeoView } from '@/components/ui/NeoView';

import { useSocket, SERVER_URL } from '@/hooks/useSocket';

// Mock Data
const PROTAGONIST = "Kevin";
const STORY_CHUNKS = [
  {
    id: 1,
    text: `${PROTAGONIST} thought a 'fighting crocodile' meant a debate club with reptiles. He prepared a strong opening statement.`,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=3454&auto=format&fit=crop', // Placeholder
  },
  {
    id: 2,
    text: "Then he realized everyone else brought weapons. He brought a soup spoon.",
    image: 'https://images.unsplash.com/photo-1623945239920-802521198583?q=80&w=3136&auto=format&fit=crop', // Placeholder
  },
  {
    id: 3,
    text: "Finally, he tried to hug the referee to stop the violence. The referee was a mannequin.",
    image: 'https://images.unsplash.com/photo-1503435980611-27c1b1c28c89?q=80&w=3560&auto=format&fit=crop', // Placeholder
  },
];
const SUMMARY_TEXT = `And that is why ${PROTAGONIST} is solely responsible for the new "No Hugging" rule at the zoo.`;

export default function StoryResultScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { gameComplete, awards } = useSocket();

  // Audio Player
  const player = useAudioPlayer(require('@/assets/audios/ui-pop-sound-316482.mp3'));

  const playPop = useCallback(() => {
    player.seekTo(0);
    player.play();
  }, [player]);

  // Derive protagonist from mostClueless (troll) name
  const protagonist = awards?.mostClueless?.name ?? PROTAGONIST;

  // Map segments to story chunks with images and object names from results
  // Fallback to MOCK data if no gameComplete (e.g. Test Story mode)
  const storyChunks: ChunkData[] = useMemo(() => {
    if (!gameComplete) {
      // Return mock chunks mapped to ChunkData interface
      return STORY_CHUNKS.map(chunk => ({
        id: chunk.id,
        text: chunk.text,
        image: chunk.image,
        objectName: 'Mock Object',
        winnerName: 'Mock Winner'
      }));
    }

    return gameComplete.segments.map((seg) => {
      const result = gameComplete.results[seg.index];
      return {
        id: seg.index,
        text: seg.lead,
        image: result?.photoPath ? `${SERVER_URL}/${result.photoPath.replace(/^\/+/, '')}` : null,
        objectName: result?.objectName ?? null,
        winnerName: result?.winnerName ?? null,
      };
    });
  }, [gameComplete]);

  const summaryText = gameComplete?.finalStory ?? SUMMARY_TEXT;

  // State
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0); // 0, 1, 2
  const [showSummary, setShowSummary] = useState(false); // After chunks

  // Triggers for specific steps within a chunk
  // We can track the "state" of the current chunk: 'typing' | 'waiting' | 'image' | 'done'

  const handleNext = () => {
    // Determine next state
    if (currentChunkIndex < storyChunks.length - 1) {
      setCurrentChunkIndex(prev => prev + 1);
    } else {
      setShowSummary(true);
      // Determine if we need to scroll to bottom for summary
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Wrap in useCallback to ensure stable reference
  const onChunkComplete = useCallback(() => {
    // Called when a chunk (text typed + image revealed) is fully done
    // Automatically advance to next chunk after a small delay
    setTimeout(() => {
      handleNext();
    }, 1500); // 1.5s reading time before next chunk starts
  }, [currentChunkIndex]); // key dependency

  return (
    <SafeAreaView className="flex-1 bg-neo-background" edges={['left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 10, paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[28px] text-neo-text text-center mb-8 mt-2.5"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          The Legend of {protagonist}
        </Text>

        {storyChunks.map((chunk, index: number) => (
          (index <= currentChunkIndex) && (
            <StoryChunk
              key={chunk.id}
              data={chunk}
              isActive={index === currentChunkIndex && !showSummary}
              onComplete={index === currentChunkIndex ? onChunkComplete : undefined}
              playPop={playPop}
            />
          )
        ))}

        {showSummary && (
          <View className="mb-10 w-full items-center">
            <NeoView className="mb-[30px] w-full">
              <Text
                className="text-2xl text-neo-text text-center leading-8"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {summaryText}
              </Text>
            </NeoView>

            <View className="w-full">
              <NeoButton
                title="Next"
                onPress={() => router.replace('/prizes')}
                variant="primary"
              />
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

interface ChunkData {
  id: number;
  text: string;
  image: string | null;
  objectName: string | null;
  winnerName: string | null;
}

// Sub-component for each Story Pair
function StoryChunk({ data, isActive, onComplete, playPop }: { data: ChunkData, isActive: boolean, onComplete?: () => void, playPop: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [isTypingDone, setIsTypingDone] = useState(false);
  // Refs to track state inside intervals/timeouts if needed, but simple dependency logic is better

  // Typewriter Effect
  useEffect(() => {
    // If we are already done typing, ensure final state is correct and do nothing else
    if (isTypingDone) {
      if (displayedText !== data.text) setDisplayedText(data.text);
      if (!showImage && !isActive) setShowImage(true); // If not active, force show image
      return;
    }

    // If it's not active anymore (e.g. previous chunk rendered initially as historical), ensure full state
    if (!isActive) {
      setDisplayedText(data.text);
      setShowImage(true);
      setIsTypingDone(true);
      return;
    }

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= data.text.length) {
        setDisplayedText(data.text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsTypingDone(true);

        // Play sound 0.2s before image (which is at 1s in total)
        setTimeout(() => {
          playPop();
        }, 800);

        // Delay before showing image
        setTimeout(() => {
          setShowImage(true);
          // Notify parent completion after image appears
          if (onComplete) onComplete();
        }, 1000); // 1s delay (The "Comic Pause")
      }
    }, 40); // 0.75x speed (slower)

    return () => clearInterval(intervalId);
  }, [isActive, data.text, isTypingDone, onComplete, playPop]);

  return (
    <View className="mb-10 w-full">
      <View className="min-h-[60px] mb-4">
        <Text
          className="text-xl text-neo-text leading-7"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {displayedText}
        </Text>
      </View>

      {/* Image Container */}
      <View className="min-h-[200px] max-h-[400px] w-full items-center">
        {showImage && data.image && (
          <View className="w-full">
            {/* Object Name Badge */}
            {data.objectName && (
              <View className="bg-neo-shadow px-4 py-2 rounded-t-xl border-2 border-b-0 border-neo-border">
                <Text
                  className="text-lg text-neo-card text-center"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  📸 {data.objectName}
                </Text>
                {data.winnerName && (
                  <Text
                    className="text-sm text-neo-card text-center opacity-80"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    by {data.winnerName}
                  </Text>
                )}
              </View>
            )}
            <NeoView className="w-full aspect-video bg-neo-shadow" style={data.objectName ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined}>
              <Image
                source={{ uri: data.image }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </NeoView>
          </View>
        )}
      </View>
    </View>
  );
}
