import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { NeoButton } from '@/components/ui/NeoButton';
import { Colors } from '@/constants/theme';

export default function PlayerWaitingRoomScreen() {
    const params = useLocalSearchParams<{
        nickname: string;
        roomPin: string;
    }>();

    const nickname = params.nickname;
    const roomPin = params.roomPin;

    // These values would come from the server/host in a real app
    const [rounds] = useState(3);
    const [timer] = useState(30);
    const [isReady, setIsReady] = useState(false);

    // Mock players list - in real app, this would update from server
    const players = [
        { id: '1', name: 'Host', isReady: true },
        { id: '2', name: nickname || 'Player', isReady: isReady }, // Current player's ready state
        { id: '3', name: 'Alice', isReady: true },
        { id: '4', name: 'Bob', isReady: false }, // Pending
    ];

    const handleReady = () => {
        setIsReady(!isReady);
        // In a real app, this would send the ready status to the server
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.roomCodeLabel}>ROOM PIN:</Text>
                    <Text style={styles.roomCode}>{roomPin}</Text>
                </View>

                {/* Game Settings - Read-only display for players */}
                <View style={styles.settingsContainer}>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>ROUNDS:</Text>
                        <View style={styles.settingValueBox}>
                            <Text style={styles.settingValue}>{rounds}</Text>
                        </View>
                    </View>
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>TIMER:</Text>
                        <View style={styles.settingValueBox}>
                            <Text style={styles.settingValue}>{timer} sec</Text>
                        </View>
                    </View>
                </View>

                {/* Player List */}
                <View style={styles.playerListContainer}>
                    <Text style={styles.playerListTitle}>PLAYERS ({players.length}/8)</Text>
                    <View style={styles.playersGrid}>
                        {players.map((player) => (
                            <View key={player.id} style={styles.playerChip}>
                                <Text style={styles.playerName}>{player.name}</Text>
                                {player.isReady ? (
                                    <Ionicons name="checkmark-circle" size={20} color="green" style={styles.readyIcon} />
                                ) : null}
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* Ready Button */}
            <View style={styles.footer}>
                <NeoButton
                    title={isReady ? "READY ✓" : "READY"}
                    onPress={handleReady}
                    variant={isReady ? "primary" : "outline"}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neo.background,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        width: '100%',
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    roomCodeLabel: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        marginBottom: 5,
    },
    roomCode: {
        fontSize: 48,
        fontFamily: 'Nunito_700Bold',
    },
    settingsContainer: {
        width: '100%',
        marginBottom: 30,
        gap: 15,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    settingLabel: {
        fontSize: 20,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.neo.text,
    },
    settingValueBox: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.neo.card,
        borderWidth: 2,
        borderColor: Colors.neo.border,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        shadowColor: Colors.neo.shadow,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    settingValue: {
        fontSize: 20,
        fontFamily: 'Nunito_700Bold',
        color: Colors.neo.text,
    },
    playerListContainer: {
        width: '100%',
        marginBottom: 20,
    },
    playerListTitle: {
        fontSize: 18,
        fontFamily: 'Nunito_700Bold',
        marginBottom: 10,
        textAlign: 'left',
    },
    playersGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neo.card,
        borderWidth: 2,
        borderColor: Colors.neo.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: Colors.neo.shadow,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 0,
    },
    playerName: {
        fontSize: 16,
        fontFamily: 'Nunito_600SemiBold',
        color: Colors.neo.text,
    },
    readyIcon: {
        marginLeft: 6,
    },
    footer: {
        padding: 20,
        paddingBottom: 100,
    },
});
