import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { NeoButton } from '@/components/ui/NeoButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function GameScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(59);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedCount, setSubmittedCount] = useState(3); // Mock data

    useEffect(() => {
        if (timeLeft > 0 && !photo) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, photo]);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    const handleTakePhoto = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    skipProcessing: true, // Faster capture
                });
                if (photo) {
                    setPhoto(photo.uri);
                }
            } catch (error) {
                console.error('Failed to take photo:', error);
            }
        }
    };

    const handleRetake = () => {
        setPhoto(null);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            setIsSubmitting(false);
            // Navigate to results or waiting screen? For now just log
            console.log('Submitted photo:', photo);
            router.push('/'); // Go back home for now, or maybe staying here waiting for others
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <Text style={styles.timeText}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <View style={styles.icons}>
                        <Ionicons name="cellular" size={20} color="black" />
                        <Ionicons name="wifi" size={20} color="black" />
                        <Ionicons name="battery-full" size={20} color="black" />
                    </View>
                </View>

                <Text style={styles.promptLabel}>Show them:</Text>
                <Text style={styles.promptText}>
                    Something you would use when in a fight with crocodiles
                </Text>

                <Text style={styles.criteriaText}>
                    Criteria: <Text style={styles.criteriaHighlight}>The Weakest</Text>
                </Text>

                {/* Timer Bar */}
                <View style={styles.timerContainer}>
                    <Text style={styles.timerText}>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</Text>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${(timeLeft / 59) * 100}%` }
                            ]}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.cameraContainer}>
                {photo ? (
                    <Image source={{ uri: photo }} style={styles.camera} resizeMode="cover" />
                ) : (
                    <CameraView
                        style={styles.camera}
                        facing="back"
                        ref={cameraRef}
                    >
                        <View style={styles.cameraOverlay}>
                            <TouchableOpacity
                                style={styles.shutterButton}
                                onPress={handleTakePhoto}
                                activeOpacity={0.7}
                            >
                                <View style={styles.shutterInner} />
                                <Ionicons name="camera" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                    </CameraView>
                )}
            </View>

            <View style={styles.footer}>
                {photo ? (
                    <View style={styles.reviewControls}>
                        <NeoButton
                            title="submit"
                            onPress={handleSubmit}
                            style={styles.submitButtonContainer}
                            backgroundColor="#C5835C"
                            textColor="#FFF"
                        />
                        <NeoButton
                            title="retake"
                            onPress={handleRetake}
                            style={styles.retakeButtonContainer}
                            backgroundColor="#D2A27C"
                            textColor="#FFF"
                        />
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusCount}>{submittedCount}/7</Text>
                            <Text style={styles.statusLabel}>have submitted</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusCount}>{submittedCount}/7</Text>
                        <Text style={styles.statusLabel}>have submitted</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neo.background,
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 20,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        display: 'none', // Hiding fake status bar since we have SafeAreaView
    },
    timeText: {
        fontWeight: '600',
        fontSize: 14,
    },
    icons: {
        flexDirection: 'row',
        gap: 5,
    },
    promptLabel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.neo.text,
        marginBottom: 8,
    },
    promptText: {
        fontSize: 18,
        color: Colors.neo.text,
        lineHeight: 24,
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace', // Or use a custom font if available
    },
    criteriaText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.neo.text,
        marginBottom: 20,
    },
    criteriaHighlight: {
        // You could add a highlight color or underline here if needed
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    timerText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
        width: 60,
    },
    progressBarBg: {
        flex: 1,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.neo.text, // or a primary color
        borderRadius: 2,
    },
    cameraContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.neo.text,
    },
    camera: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    cameraOverlay: {
        paddingBottom: 30,
        width: '100%',
        alignItems: 'center',
    },
    shutterButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E8CA98', // Light brownish/beige from screenshot
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    shutterInner: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    footer: {
        height: 100,
        justifyContent: 'center',
    },
    reviewControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    submitButtonContainer: {
        flex: 1,
    },
    retakeButtonContainer: {
        flex: 1,
        opacity: 0.9,
    },
    statusContainer: {
        marginLeft: 10,
        alignItems: 'flex-end',
        minWidth: 100,
    },
    statusCount: {
        fontSize: 20,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'right',
    },
});
