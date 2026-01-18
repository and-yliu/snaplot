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
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

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
        console.log('Submitted photo:', photo);
        // Navigate immediately
        router.push('/round-result' as any);
        setIsSubmitting(false);
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
                            variant="primary"
                        />
                        <NeoButton
                            title="retake"
                            onPress={handleRetake}
                            style={styles.retakeButtonContainer}
                            variant="outline"
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
        paddingHorizontal: 24, // Matched to 24
    },
    header: {
        marginBottom: 20,
        alignItems: 'center', // Center content
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        width: '100%',
        display: 'none',
    },
    timeText: {
        fontFamily: 'Nunito_600SemiBold',
        fontSize: 14,
        color: Colors.neo.text,
    },
    icons: {
        flexDirection: 'row',
        gap: 5,
    },
    promptText: {
        fontSize: 24,
        color: Colors.neo.text,
        lineHeight: 30,
        marginBottom: 16,
        marginTop: 20,
        fontFamily: 'Nunito_700Bold',
        textAlign: 'center',
    },
    criteriaText: {
        fontSize: 20,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.neo.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    criteriaHighlight: {
        fontFamily: 'Nunito_700Bold',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        width: '100%',
    },
    timerText: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        fontVariant: ['tabular-nums'],
        width: 70,
        color: Colors.neo.text,
        flexShrink: 0,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: 'rgba(0,0,0,0.1)', // Light track for contrast
        borderRadius: 3,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.neo.text,
        borderRadius: 3,
    },
    cameraContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#000',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: Colors.neo.border, // Use border color
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
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#E8CA98', // Keep consistent or change to Neo? Kept for now
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        shadowColor: Colors.neo.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
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
        fontFamily: 'Nunito_700Bold',
        color: Colors.neo.text,
    },
    statusLabel: {
        fontSize: 12,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.neo.text,
        textAlign: 'right',
    },
});
